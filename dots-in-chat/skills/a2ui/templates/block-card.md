# Template: a chat block with follow-up Suggestions

The block comes first in a Column, the Suggestions under it. A tap on a suggestion sends
`say` with the live values of the block (onScreen); answer from those.

<a2ui>
surface("sip_plan")
root = Column([calc, next])
calc = GrowthCalculator(10000, 12, 15)
next = Suggestions("Want me to compare 20 years, or add inflation?", ["Make it 20 years", "Add inflation", "Save this plan"])
</a2ui>
