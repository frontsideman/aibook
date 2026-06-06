import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ChildProfileCard, { type ChildProfile } from "./ChildProfileCard";

const baseProfile: ChildProfile = {
  id: "p1",
  name: "Noah",
  age: 7,
  gender: "male",
  interests: ["maps", "kindness", "school"],
};

describe("ChildProfileCard", () => {
  it("renders name, meta and initials", () => {
    render(<ChildProfileCard profile={baseProfile} />);

    expect(screen.getByRole("heading", { name: "Noah" })).toBeInTheDocument();
    expect(screen.getByText("Age 7 · Boy")).toBeInTheDocument();
    expect(screen.getByText("N")).toBeInTheDocument();
  });

  it("renders initials for multi-word names", () => {
    render(
      <ChildProfileCard
        profile={{ ...baseProfile, name: "Mary Jane" }}
      />,
    );

    expect(screen.getByText("MJ")).toBeInTheDocument();
  });

  it("falls back to ? when name is empty", () => {
    render(<ChildProfileCard profile={{ ...baseProfile, name: "   " }} />);

    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("renders all interest chips without a separate section label", () => {
    render(<ChildProfileCard profile={baseProfile} />);

    expect(screen.queryByText("Interests")).not.toBeInTheDocument();
    const chips = screen.getByTestId("interest-chips");
    expect(chips).toHaveTextContent("maps");
    expect(chips).toHaveTextContent("kindness");
    expect(chips).toHaveTextContent("school");
    expect(chips.querySelectorAll("span")).toHaveLength(3);
  });

  it("hides the Interests block when there are no interests", () => {
    render(
      <ChildProfileCard
        profile={{ ...baseProfile, interests: [] }}
      />,
    );

    expect(screen.queryByText("Interests")).not.toBeInTheDocument();
    expect(screen.queryByTestId("interest-chips")).not.toBeInTheDocument();
  });

  it("invokes onEdit and onDelete handlers", () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <ChildProfileCard
        profile={baseProfile}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit Noah" }));
    expect(onEdit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Delete Noah" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("exposes accessible aria labels for actions", () => {
    render(<ChildProfileCard profile={baseProfile} />);

    expect(
      screen.getByRole("button", { name: "Edit Noah" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete Noah" }),
    ).toBeInTheDocument();
  });

  it("uses theme-safe semantic colors for the edit action", () => {
    render(<ChildProfileCard profile={baseProfile} />);

    expect(screen.getByRole("button", { name: "Edit Noah" })).toHaveClass(
      "bg-secondary",
      "text-secondary-foreground",
      "hover:bg-secondary/80",
    );
  });
});
