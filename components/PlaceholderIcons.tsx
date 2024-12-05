// PlaceholderIcons.tsx
import React from 'react';
import { User, PenTool, Calendar, Mail } from 'lucide-react';

const iconClassName = "w-6 h-6 text-gray-500";

export const NamePlaceholder = () => (
  <div className="flex items-center justify-center text-black space-x-2">
    <User className={iconClassName} />
    <span>Name</span>
  </div>
);

export const SignaturePlaceholder = () => (
  <div className="flex items-center justify-center text-black space-x-2">
    <PenTool className={iconClassName} />
    <span>Signature</span>
  </div>
);

export const DatePlaceholder = () => (
  <div className="flex items-center justify-center text-black space-x-2">
    <Calendar className={iconClassName} />
    <span>Date</span>
  </div>
);

export const InitialsPlaceholder = () => (
  <div className="flex items-center justify-center text-black space-x-2">
    <User className={iconClassName} />
    <span>Initials</span>
  </div>
);

export const EmailPlaceholder = () => (
  <div className="flex items-center justify-center text-black space-x-2">
    <Mail className={iconClassName} />
    <span>Email</span>
  </div>
);
