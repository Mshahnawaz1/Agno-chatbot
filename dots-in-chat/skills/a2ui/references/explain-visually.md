# Explaining a concept visually (CNN, how X works, the parts of Y)

"Explain X visually", "show me how X works", "diagram of X" are answered with a surface, never with
Mermaid, ASCII art or a code block. Compose it from components you already have:

1. A **pipeline**: a Row of small Cards, one per stage, each with an Icon (play, search, settings,
   check ...), a bold Text name and a one-line caption. Number them ("Step 1: ...", never "1." at the start of a Text: Markdown makes a list of it); the Row wraps by itself, so no arrows between Cards.
   More than 5 stages: use a Tabs (one tab per stage) or two Rows.
2. A **VegaChart** of one measurable aspect, with real numbers (sizes, counts, shares) taken from the
   concept itself, not invented data (an architecture's layer shapes are facts; a "contribution"
   percentage is not). Copy a recipe from chart.md, change only the data.
3. At most 3 short sentences of text in the reply, before the block. The explanation lives in the cards.
4. A Suggestions line (block-suggestions.md) under it for going deeper.

Verified recipe (CNN: input 32x32 RGB image through a small network; activations per stage):

<a2ui>
surface("cnn_visual")
root = Card(Column([title, flow, note, chart, next]))
title = Text("### A CNN, stage by stage")
flow = Row([s1, s2, s3, s4, s5], "start", "stretch")
s1 = Card(Column([i1, t1, c1], "start", "center"))
i1 = Icon("photo")
t1 = Text("**Step 1: Image**")
c1 = Text("32x32 pixels, 3 colour channels", "caption")
s2 = Card(Column([i2, t2, c2], "start", "center"))
i2 = Icon("search")
t2 = Text("**Step 2: Convolution**")
c2 = Text("Small filters slide over it and light up on edges and textures", "caption")
s3 = Card(Column([i3, t3, c3], "start", "center"))
i3 = Icon("check")
t3 = Text("**Step 3: ReLU**")
c3 = Text("Keeps positive signals, zeroes the rest", "caption")
s4 = Card(Column([i4, t4, c4], "start", "center"))
i4 = Icon("download")
t4 = Text("**Step 4: Pooling**")
c4 = Text("Shrinks the map, keeps the strongest value in each 2x2 patch", "caption")
s5 = Card(Column([i5, t5, c5], "start", "center"))
i5 = Icon("star")
t5 = Text("**Step 5: Classifier**")
c5 = Text("Dense layer turns features into class scores", "caption")
note = Text("The image shrinks stage by stage while the number of feature maps grows:", "caption")
chart = VegaChart({"data": {"values": [{"stage": "Input", "order": 1, "size": 32, "maps": 3}, {"stage": "Conv 1", "order": 2, "size": 32, "maps": 16}, {"stage": "Pool 1", "order": 3, "size": 16, "maps": 16}, {"stage": "Conv 2", "order": 4, "size": 16, "maps": 32}, {"stage": "Pool 2", "order": 5, "size": 8, "maps": 32}]}, "transform": [{"fold": ["size", "maps"], "as": ["measure", "value"]}], "mark": {"type": "bar"}, "encoding": {"x": {"field": "stage", "type": "nominal", "sort": {"field": "order"}, "title": null}, "xOffset": {"field": "measure"}, "y": {"field": "value", "type": "quantitative", "title": "Side length (px) / feature maps"}, "color": {"field": "measure", "type": "nominal", "title": null}}}, 260)
next = Suggestions("Where next?", ["How is a filter learned?", "Show a 3x3 convolution", "Compare with a Transformer"])
</a2ui>
