# Template: change or remove a surface from an earlier turn

Change it in place: name the existing surface with update=true and send only what changes.
New data:

<a2ui>
surface("trip_prefs", update=true)
$/form/days = ["3"]
</a2ui>

Or a component with the same name, redrawn (it must stay reachable from root):

<a2ui>
surface("sip_plan", update=true)
calc = GrowthCalculator(10000, 12, 20)
</a2ui>

Remove one only when the user asks, with the command alone in its block:

<a2ui>
deleteSurface("trip_prefs")
</a2ui>

For a different layout, don't delete: create a new surface with a new id.
