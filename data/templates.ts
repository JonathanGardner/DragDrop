import {
  NamePlaceholder,
  SignaturePlaceholder,
  DatePlaceholder,
  InitialsPlaceholder,
  EmailPlaceholder,
} from '@/components/PlaceholderIcons';
import { Template } from '@/types';

export const templates: Template[] = [
  { id: 'name', icon: NamePlaceholder, label: 'Name', width: 100, height: 30 },
  {
    id: 'signature',
    icon: SignaturePlaceholder,
    label: 'Signature',
    width: 150,
    height: 30,
  },
  { id: 'date', icon: DatePlaceholder, label: 'Date', width: 100, height: 30 },
  {
    id: 'initials',
    icon: InitialsPlaceholder,
    label: 'Initials',
    width: 120,
    height: 30,
  },
  { id: 'email', icon: EmailPlaceholder, label: 'Email', width: 100, height: 30 },
];
