"use client";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DashboardFiltersProps = {
  search: string;
  status: string;
  style: string;
  type: string;
  profile: string;
  profiles: string[];
  sort: "updated" | "title";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onStyleChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onProfileChange: (value: string) => void;
  onSortChange: (value: "updated" | "title") => void;
};

const STATUSES = ["", "DRAFT", "GENERATING", "REVIEW", "COMPLETED", "FAILED"];
const TYPES = ["", "AI_ADAPTED", "MANUAL"];
const STYLES = [
  "",
  "WATERCOLOR",
  "CARTOON",
  "REALISTIC",
  "PIXAR",
  "SKETCH",
  "MANGA",
  "COMIC",
];

export default function DashboardFilters({
  search,
  status,
  style,
  type,
  profile,
  profiles,
  sort,
  onSearchChange,
  onStatusChange,
  onStyleChange,
  onTypeChange,
  onProfileChange,
  onSortChange,
}: DashboardFiltersProps) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-ab-surface p-2">
      <div className="relative min-w-[220px] flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          aria-label="Search books by title"
          placeholder="Search title, profile, or prompt"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-[42px] pl-9"
        />
      </div>
      <Select
        value={status || "__all"}
        onValueChange={(value) =>
          onStatusChange(value === "__all" ? "" : value)
        }
      >
        <SelectTrigger
          aria-label="Filter by status"
          className="h-[42px] w-auto min-w-[100px]"
        >
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((entry) => (
            <SelectItem key={entry || "__all"} value={entry || "__all"}>
              {entry || "All Status"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={style || "__all"}
        onValueChange={(value) => onStyleChange(value === "__all" ? "" : value)}
      >
        <SelectTrigger
          aria-label="Filter by style"
          className="h-[42px] w-auto min-w-[100px]"
        >
          <SelectValue placeholder="Style" />
        </SelectTrigger>
        <SelectContent>
          {STYLES.map((entry) => (
            <SelectItem key={entry || "__all"} value={entry || "__all"}>
              {entry || "All Styles"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={type || "__all"}
        onValueChange={(value) => onTypeChange(value === "__all" ? "" : value)}
      >
        <SelectTrigger
          aria-label="Filter by type"
          className="h-[42px] w-auto min-w-[100px]"
        >
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          {TYPES.map((entry) => (
            <SelectItem key={entry || "__all"} value={entry || "__all"}>
              {entry || "All Types"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={profile || "__all"}
        onValueChange={(value) =>
          onProfileChange(value === "__all" ? "" : value)
        }
      >
        <SelectTrigger
          aria-label="Filter by profile"
          className="h-[42px] w-auto min-w-[100px]"
        >
          <SelectValue placeholder="Profile" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all">All Profiles</SelectItem>
          {profiles.map((entry) => (
            <SelectItem key={entry} value={entry}>
              {entry}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={sort}
        onValueChange={(value) => onSortChange(value as "updated" | "title")}
      >
        <SelectTrigger
          aria-label="Sort books"
          className="h-[42px] w-auto min-w-[100px]"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="updated">Last Updated</SelectItem>
          <SelectItem value="title">Title</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
