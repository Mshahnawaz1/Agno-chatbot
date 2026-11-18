/** Layout components: Row, Column, List, Card, Tabs, Divider. */
import { CardApi, ColumnApi, DividerApi, ListApi, ModalApi, RowApi, TabsApi } from '@a2ui/web_core/v1_0'
import { createComponentImplementation } from '@a2ui/react/v0_9'
import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Separator } from '@/components/shadcn/separator'
import { Tabs as TabsRoot, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/tabs'
import { cn } from '@/lib/utils'
import { Children } from './parts'
import { weightStyle } from './props'

const justify = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  spaceBetween: 'justify-between',
  spaceAround: 'justify-around',
  spaceEvenly: 'justify-evenly',
  stretch: 'justify-stretch',
} as const

const align = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
} as const

export const Row = createComponentImplementation(RowApi, ({ props, buildChild }) => (
  <div
    style={weightStyle(props.weight)}
    className={cn('a2ui-row flex flex-wrap gap-x-6 gap-y-4', justify[props.justify ?? 'start'], align[props.align ?? 'stretch'])}
  >
    <Children items={props.children} buildChild={buildChild} />
  </div>
))

export const Column = createComponentImplementation(ColumnApi, ({ props, buildChild }) => (
  <div
    style={weightStyle(props.weight)}
    className={cn('a2ui-column flex flex-col gap-4', justify[props.justify ?? 'start'], align[props.align ?? 'stretch'])}
  >
    <Children items={props.children} buildChild={buildChild} />
  </div>
))

/** A list reads as rows split by hairlines, like a table without columns. */
export const List = createComponentImplementation(ListApi, ({ props, buildChild }) => {
  const horizontal = props.direction === 'horizontal'
  return (
    <div
      role="list"
      style={weightStyle(props.weight)}
      className={cn(
        'a2ui-list flex',
        horizontal ? 'flex-row gap-3 overflow-x-auto pb-1' : 'flex-col divide-y divide-border',
        align[props.align ?? 'stretch'],
      )}
    >
      <Children items={props.children} buildChild={buildChild} />
    </div>
  )
})

export const Card = createComponentImplementation(CardApi, ({ props, buildChild }) => (
  <div style={weightStyle(props.weight)} className="a2ui-card rounded-2xl border border-border p-5">
    {props.child ? buildChild(props.child) : null}
  </div>
))

export const Tabs = createComponentImplementation(TabsApi, ({ props, buildChild }) => {
  const tabs = props.tabs ?? []
  if (tabs.length === 0) return null
  return (
    <TabsRoot defaultValue="0" style={weightStyle(props.weight)} className="gap-4">
      <TabsList>
        {tabs.map((t, i) => (
          <TabsTrigger key={i} value={String(i)}>
            {t.title}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((t, i) => (
        <TabsContent key={i} value={String(i)}>
          {buildChild(t.child)}
        </TabsContent>
      ))}
    </TabsRoot>
  )
})

export const Divider = createComponentImplementation(DividerApi, ({ props }) => (
  <Separator orientation={props.axis ?? 'horizontal'} className="data-[orientation=vertical]:self-stretch" />
))

/** The trigger child draws inline; pressing it (its own events still fire) opens `content`. */
export const Modal = createComponentImplementation(ModalApi, ({ props, buildChild }) => {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <span style={weightStyle(props.weight)} className="inline-flex" onClickCapture={() => setOpen(true)}>
        {buildChild(props.trigger)}
      </span>
      <DialogContent title="Details" hideTitle>
        {buildChild(props.content)}
      </DialogContent>
    </Dialog>
  )
})
