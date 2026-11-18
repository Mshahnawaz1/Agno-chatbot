/** Display components: Text, Image, Icon. */
import {
  ArrowLeft, ArrowRight, Bell, BellOff, Calendar, CalendarDays, Camera, Check, CircleAlert, CircleHelp,
  CircleUser, CreditCard, Download, Ellipsis, EllipsisVertical, Eye, EyeOff, FastForward, Folder, Heart,
  HeartOff, House, Image as ImageIcon, Info, Lock, LockOpen, Mail, MapPin, Menu, Paperclip, Pause, Pencil,
  Phone, Play, Plus, Printer, RefreshCw, Rewind, Search, Send, Settings, Share2, ShoppingCart, SkipBack,
  SkipForward, Smartphone, Square, Star, StarHalf, StarOff, Trash2, TriangleAlert, Upload, User, Volume,
  Volume1, Volume2, VolumeOff, X, type LucideIcon,
} from 'lucide-react'
import { AudioPlayerApi, IconApi, ImageApi, TextApi, VideoApi } from '@a2ui/web_core/v1_0'
import { createComponentImplementation } from '@a2ui/react/v0_9'
import { Markdown } from '@/components/Markdown'
import { cn } from '@/lib/utils'
import { weightStyle } from './props'

/** Text is Markdown: v1.0 has no heading variants, so headings and tables are written in it. */
export const Text = createComponentImplementation(TextApi, ({ props }) => (
  <div style={weightStyle(props.weight)} className={cn('a2ui-text', props.variant === 'caption' && 'a2ui-caption')}>
    <Markdown className="a2ui-markdown">{String(props.text ?? '')}</Markdown>
  </div>
))

const imageSize = {
  icon: 'size-8',
  avatar: 'size-12 rounded-full',
  smallFeature: 'max-h-32',
  mediumFeature: 'max-h-64',
  largeFeature: 'max-h-96',
  header: 'max-h-72 w-full',
} as const

const imageFit = {
  contain: 'object-contain',
  cover: 'object-cover',
  fill: 'object-fill',
  none: 'object-none',
  scaleDown: 'object-scale-down',
} as const

export const Image = createComponentImplementation(ImageApi, ({ props }) => (
  <img
    src={props.url ?? ''}
    alt={props.description ?? ''}
    loading="lazy"
    style={weightStyle(props.weight)}
    className={cn('rounded-xl', imageSize[props.variant ?? 'mediumFeature'], imageFit[props.fit ?? 'cover'])}
  />
))

export const Video = createComponentImplementation(VideoApi, ({ props }) => (
  <video
    src={props.url ?? ''}
    poster={props.posterUrl}
    controls
    preload="metadata"
    style={weightStyle(props.weight)}
    className="w-full max-w-2xl rounded-xl bg-black"
  />
))

export const AudioPlayer = createComponentImplementation(AudioPlayerApi, ({ props }) => (
  <figure style={weightStyle(props.weight)} className="flex flex-col gap-2">
    {props.description ? <figcaption className="text-sm text-fg-muted">{props.description}</figcaption> : null}
    <audio src={props.url ?? ''} controls preload="metadata" className="w-full max-w-md" />
  </figure>
))

/** The basic catalog's icon names (Material names), drawn with the app's lucide set. */
const icons: Record<string, LucideIcon> = {
  accountCircle: CircleUser, add: Plus, arrowBack: ArrowLeft, arrowForward: ArrowRight,
  attachFile: Paperclip, calendarToday: Calendar, call: Phone, camera: Camera, check: Check,
  close: X, delete: Trash2, download: Download, edit: Pencil, event: CalendarDays, error: CircleAlert,
  fastForward: FastForward, favorite: Heart, favoriteOff: HeartOff, folder: Folder, help: CircleHelp,
  home: House, info: Info, locationOn: MapPin, lock: Lock, lockOpen: LockOpen, mail: Mail, menu: Menu,
  moreVert: EllipsisVertical, moreHoriz: Ellipsis, notificationsOff: BellOff, notifications: Bell,
  pause: Pause, payment: CreditCard, person: User, phone: Smartphone, photo: ImageIcon, play: Play,
  print: Printer, refresh: RefreshCw, rewind: Rewind, search: Search, send: Send, settings: Settings,
  share: Share2, shoppingCart: ShoppingCart, skipNext: SkipForward, skipPrevious: SkipBack, star: Star,
  starHalf: StarHalf, starOff: StarOff, stop: Square, upload: Upload, visibility: Eye,
  visibilityOff: EyeOff, volumeDown: Volume1, volumeMute: Volume, volumeOff: VolumeOff,
  volumeUp: Volume2, warning: TriangleAlert,
}

export const Icon = createComponentImplementation(IconApi, ({ props }) => {
  const name = props.name as unknown
  const className = 'size-5 shrink-0 text-fg-muted'
  if (name && typeof name === 'object' && 'svgPath' in name) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
        <path d={String((name as { svgPath: unknown }).svgPath)} />
      </svg>
    )
  }
  const Glyph = icons[String(name)] ?? CircleHelp
  return <Glyph className={className} aria-hidden />
})
