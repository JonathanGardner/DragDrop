// PlaceholderIcons.tsx
import React from 'react';
import { User, PenTool, Calendar, Mail } from 'lucide-react';
import { PlaceholderProps } from '@/types';

const defaultIconSize = 100;

export const NamePlaceholder: React.FC<PlaceholderProps> = ({ iconSize = defaultIconSize, label = 'Name' }) => (
  <div className="flex items-center justify-center text-black w-full h-full overflow-hidden">
    <User style={{ width: `${iconSize}px`, height: `${iconSize}px` }} className="text-gray-500 mr-1" />
    <span className="whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>
  </div>
);

export const SignaturePlaceholder: React.FC<PlaceholderProps> = ({ iconSize = defaultIconSize, label = 'Signature' }) => (
  <div className="flex items-center justify-center text-black w-full h-full overflow-hidden">
    <PenTool style={{ width: `${iconSize}px`, height: `${iconSize}px` }} className="text-gray-500 mr-1" />
    <span className="whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>
  </div>
);

export const DatePlaceholder: React.FC<PlaceholderProps> = ({ iconSize = defaultIconSize, label = 'Date' }) => (
  <div className="flex items-center justify-center text-black w-full h-full overflow-hidden">
    <Calendar style={{ width: `${iconSize}px`, height: `${iconSize}px` }} className="text-gray-500 mr-1"/>
    <span className="whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>
  </div>
);

export const InitialsPlaceholder: React.FC<PlaceholderProps> = ({ iconSize = defaultIconSize, label = 'Initials' }) => (
  <div className="flex items-center justify-center text-black w-full h-full overflow-hidden">
    <User style={{ width: `${iconSize}px`, height: `${iconSize}px` }} className="text-gray-500 mr-1"/>
    <span className="whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>
  </div>
);

export const EmailPlaceholder: React.FC<PlaceholderProps> = ({ iconSize = defaultIconSize, label = 'Email' }) => (
  <div className="flex items-center justify-center text-black w-full h-full overflow-hidden">
    <Mail style={{ width: `${iconSize}px`, height: `${iconSize}px` }} className="text-gray-500 mr-1" />
    <span className="whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>
  </div>
);
