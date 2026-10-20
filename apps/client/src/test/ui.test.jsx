import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Pagination, StatusPill, Switch, EmptyState, Field, Input } from "@/components/ui";

describe("ui primitives", () => {
  it("renders status pills with friendly labels", () => {
    render(<StatusPill status="refund_requested" />);
    expect(screen.getByText("Refund requested")).toBeInTheDocument();
  });

  it("paginates with ellipses and reports clicks", () => {
    const onChange = vi.fn();
    render(<Pagination page={5} pages={10} onChange={onChange} />);
    expect(screen.getAllByText("…")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onChange).toHaveBeenCalledWith(6);
    expect(screen.getByRole("button", { name: "5" })).toHaveAttribute("aria-current", "page");
  });

  it("toggles a switch", () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} label="Dark mode" />);
    fireEvent.click(screen.getByRole("switch", { name: "Dark mode" }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("shows field errors as alerts", () => {
    render(
      <Field label="Email" htmlFor="e" error="Enter a valid email">
        <Input id="e" />
      </Field>
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email");
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("renders empty states with actions", () => {
    render(<EmptyState title="Nothing here" body="Add one" action={<button>Add</button>} />);
    expect(screen.getByRole("heading", { name: "Nothing here" })).toBeInTheDocument();
  });
});
