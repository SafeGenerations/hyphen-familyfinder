import React from 'react';
import { UserRoundPlus, Pencil, Wand2, Layout, UsersRound, Expand, RotateCcw, RotateCw, Download, Save, FolderOpenDot, FileEdit, Search } from 'lucide-react';

export const AddPersonIcon = (props) => <UserRoundPlus {...props} />;
export const TextToolIcon = (props) => <Pencil {...props} />;
export const AutoArrangeIcon = (props) => <Wand2 {...props} />;
export const LayoutGridIcon = (props) => <Layout {...props} />;
export const HighlightNetworkIcon = (props) => <UsersRound {...props} />;
export const FitToScreenIcon = (props) => <Expand {...props} />;
export const UndoIcon = (props) => <RotateCcw {...props} />;
export const RedoIcon = (props) => <RotateCw {...props} />;
export const ExportImageIcon = (props) => <Download {...props} />;
export const SaveIcon = (props) => <Save {...props} />;
export const OpenIcon = (props) => <FolderOpenDot {...props} />;
export const NewGenogramIcon = (props) => <FileEdit {...props} />;
export const SearchIcon = (props) => <Search {...props} />;

export const CreateHouseholdIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    {...props}
  >
    <path d="M3 9l9-7 9 7" />
    <path d="M9 22V12h6v10" />
    <path d="M3 9v11a2 2 0 0 0 2 2h3" />
    <path d="M16 22h3a2 2 0 0 0 2-2V9" />
    <circle cx="8" cy="16" r="1.5" fill="currentColor" />
    <circle cx="16" cy="16" r="1.5" fill="currentColor" />
    <rect width="22" height="22" x="1" y="1" strokeDasharray="4" rx="3" />
  </svg>
);
