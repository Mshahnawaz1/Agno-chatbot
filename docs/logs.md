
5 nov 25
Run simple agent and run it using `agent.print_response('text')`
Add knowledge as 


### Decision logs

hybrid_rrf_k : controls the 
max_results : Set the number of retrieved chunks

### JWT auth
Why?
- Signup proves nothing. It creates an account with a password.
- Login proves who you are once, with the password, and you get a token in return.
- Every later request proves who you are with the token.

Why argon2 and not sha256: it's deliberately slow and uses a lot of memory, which makes brute-forcing a leaked database very expensive. It also salts each hash for you.

Why these decisions?

Auth lives in one dependency (CurrentUser). Routes only ever say "give me the current user." That's why switching from the X-User-Id header to JWT touched one function and no routes.

The token's sub is the user id, not the email. The id never changes, and it's the same id Agno already uses for sessions and memory. Emails can change. A token holds only sub, iat and exp: anyone can read a token's contents (it's signed, not encrypted), so nothing private goes in it.

The database is still checked on every request, even though the token is signed. A token stays valid after its account is deleted. The lookup closes that gap, and it gives routes the same dict they had before. It costs one SQLite query per request.

algorithms=["HS256"] is fixed, and exp/sub are required. Otherwise a token could name its own algorithm, including alg: none, which means no signature. The test above shows that's now rejected.

jwt_secret has no default. If it's missing, the app fails at startup. With a default, the app could quietly sign tokens with a key anyone could guess.

Passwords use argon2 through pwdlib. It's deliberately slow and memory-hungry, so guessing passwords from a leaked database is expensive. Each hash is salted automatically. The 128-character cap on passwords stops one request from forcing a huge amount of hashing work.

The password hash never leaves db.py. Only get_user_by_email (used by login) selects it. get_user, which feeds CurrentUser, doesn't. Even if a route returned the user dict without UserOut, the hash couldn't leak.

Login gives the same answer for "no such email" and "wrong password", and takes the same time. A different message, or a faster reply when no password check runs, would let anyone find out which emails are registered. That's why verify_password(pw, None) still hashes against a dummy value.

Emails are lowercased and trimmed in the schema. This happens before the format check, so " Bob@X.com " is accepted and stored as bob@x.com. Login cleans the email the same way, so you can't end up with two accounts for one person.

Login is form-encoded (username, password), not JSON. That's the OAuth2 password flow, so Swagger's Authorize button at /docs works as-is. That's handy for testing the API without the frontend. The field is called username, but it holds the email.

Signup doesn't return a token; the frontend logs in straight after. This way only one endpoint creates tokens and checks passwords. The user still sees a single "Sign up" click.

Every 401 returns the same message. The client gets "Could not validate credentials" whether the token expired, was forged, or names a deleted user. Telling those apart only helps an attacker. WWW-Authenticate: Bearer is the standard header for this kind of error.

On the frontend, any 401 clears the token and opens login. This covers expiry without the frontend having to decode the token or track time. Logging out just means deleting the token. JWTs can't be cancelled before they expire, so the 60-minute expiry is what limits the damage from a stolen token. Refresh tokens are the usual next step if you want longer logins.

The token is stored in localStorage. It's simple and fine for learning. The trade-off is that any XSS bug could read it. Production apps often use an httpOnly cookie instead, which brings CSRF handling with it. Your messages already go through DOMPurify, which helps.

Changing the server URL logs you out, because a token from one server isn't valid on another. The login dialog can't be dismissed with Escape, since nothing works logged out. It has a "⚙ Server" button so you can still change the URL.


### Input token reduction

These are the changes in commit ccde10e. They build on earlier phases that had already moved the A2UI text out of the system prompt and into a lazily loaded skill (11k down to about 600 tokens).

Changes

1. Removed the search_skills call.
   - The model used to search for a skill the index already listed. That cost one full model call (~1.5k tokens).
   - search_skills is now only offered when more than 8 skills exist.
2. Made paths a required argument of get_skill_instructions, and listed file names in the skill index.
   - Before, the model first loaded the skill with no files, then loaded the block file in a second call. That second call resent the whole skill text.
   - Now the first call names what it needs, so a block turn takes one load.
   - Making the argument required is what changed the model's behaviour, because optional paths were left out.
3. Stopped loading form components on block turns.
   - Before, every load pulled in components.md (~2k tokens) and form.md.
   - Now only grammar is always loaded. The form files load only when no paths are given, and a block file brings its own card template.
4. Dropped the model-run check script.
   - The model used to run check.py before replying, which cost one more model call (~7.7k tokens) on every UI turn.
   - The server now validates as the reply streams. A rejected block gets one retry, quoting the rejected reply and the error, and that only costs tokens when a block fails.
5. Removed the dead code that went with this. That covers get_skill_script, check.py and A2uiTurn.upgraded. It saves no tokens, but it also removes the script tool schema from each request (~100 tokens).

Costs added

- File names in the index and a longer skill description add about 100–150 tokens to every request, including plain chat.
- Plain chat measured 1.3k before and 1.3k after, so this is small in practice.

Result

┌───────────┬─────────────────────────────┐
│ Scenario  │ Input tokens before → after │
├───────────┼─────────────────────────────┤
│ Budget    │ 23.5k → 5.5k                │
├───────────┼─────────────────────────────┤
│ SIP       │ 22.8k → 5.7k                │
├───────────┼─────────────────────────────┤
│ Chart     │ 25.0k → 8.5k                │
├───────────┼─────────────────────────────┤
│ Trip form │ 16.3k → 8.3k                │
└───────────┴─────────────────────────────┘

I haven't measured how much each change contributed separately, only the combined result. The numbers come from 3–6 live runs per scenario on flash-lite, so treat them as indicative.