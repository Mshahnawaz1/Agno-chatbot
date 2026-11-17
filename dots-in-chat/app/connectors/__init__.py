"""MCP connectors: remote MCP servers each user can connect to their own account.

registry.py  which connectors exist (the only file to edit when adding one)
auth.py      OAuth discovery/registration/PKCE/refresh, or API key if a server has no OAuth
tools.py     builds a user's connected MCP toolkits for the agent
"""
