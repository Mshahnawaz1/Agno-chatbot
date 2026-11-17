# Form template: ask for details

Rename the surface id, fields and event; keep the shape. Every input is bound to `$/form/...`
with a default, and the submit Event passes every field.

<a2ui>
surface("trip_prefs")
$/form/destination = ""
$/form/start = "2026-12-01T00:00:00Z"
$/form/days = ["2"]
$/form/interests = []
root = Card(Column([title, destination, start, days, interests, go]))
title = Text("### Plan your trip")
destination = TextField("Destination", $/form/destination, checks=[?required("Please add a destination")])
start = DateTimeInput($/form/start, enableDate=true, enableTime=false, label="Start date")
days = ChoicePicker(label="Duration", variant="mutuallyExclusive", options=[{label: "1 day", value: "1"}, {label: "2 days", value: "2"}, {label: "3+ days", value: "3"}], value=$/form/days)
interests = ChoicePicker(label="Interests", variant="multipleSelection", options=[{label: "Food", value: "food"}, {label: "Culture", value: "culture"}, {label: "Nature", value: "nature"}], value=$/form/interests, displayStyle="chips")
go = Button(Text("Plan my trip"), "primary", Event("plan_trip", {destination: $/form/destination, start: $/form/start, days: $/form/days, interests: $/form/interests}))
</a2ui>
