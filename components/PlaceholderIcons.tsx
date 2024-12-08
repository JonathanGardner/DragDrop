// PlaceholderIcons.tsx
import React from 'react';
import { User, PenTool, Calendar, Mail } from 'lucide-react';

const iconClassName = "h-[100%] min-h-[50%] object-contain text-gray-500";
const textClassName = "text-[1.5vh]";

export const NamePlaceholder = () => (
  <div className="flex items-center justify-center text-black">
    <User className={iconClassName} />
    <span >Name</span>
  </div>
);

export const SignaturePlaceholder = () => (
  <div className="flex items-center justify-center text-black">
    <PenTool className={iconClassName} />
    <span >Signature</span>
  </div>
);

export const DatePlaceholder = () => (
  <div className="flex items-center justify-center text-black">
    <Calendar className={iconClassName} />
    <span>Date</span>
  </div>
);

export const InitialsPlaceholder = () => (
  <div className="flex items-center justify-center text-black">
    <User className={iconClassName} />
    <span>Initials</span>
  </div>
);

export const EmailPlaceholder = () => (
  <div className="flex items-center justify-center text-black">
    <Mail className={iconClassName} />
    <span>Email</span>
  </div>
);
