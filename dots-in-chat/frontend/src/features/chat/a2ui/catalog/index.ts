/**
 * The catalog the chat renders: the A2UI v1.0 basic catalog's components drawn with shadcn/ui,
 * plus the official VegaChart component and the chat blocks (../blocks).
 *
 * The id, component names and props match the server's catalog (app/a2ui/catalog.py), which
 * the agent's prompt and the server's validator are generated from: keep the two in step.
 */
import { BASIC_FUNCTIONS, Catalog } from '@a2ui/web_core/v1_0'
import type { ReactCatalogComponent } from '@a2ui/react/v0_9'
import { BLOCKS } from '../blocks'
import { VegaChart } from './chart'
import { AudioPlayer, Icon, Image, Text, Video } from './content'
import { Button, CheckBox, ChoicePicker, DateTimeInput, Slider, TextField } from './inputs'
import { Card, Column, Divider, List, Modal, Row, Tabs } from './layout'

export const CATALOG_ID = 'dots-in-chat/chat/v1'

export const catalog = new Catalog<ReactCatalogComponent>(
  CATALOG_ID,
  '1.0',
  [
    Text, Image, Icon,
    Row, Column, List, Card, Tabs, Divider,
    Button, TextField, CheckBox, ChoicePicker, Slider, DateTimeInput,
    Video, AudioPlayer, Modal,
    VegaChart,
    ...BLOCKS,
  ] as ReactCatalogComponent[],
  BASIC_FUNCTIONS,
)
