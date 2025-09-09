import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AISearchOverlay from "./AISearchOverlay";

// Mock DOM methods
Object.defineProperty(Element.prototype, "scrollIntoView", {
  value: jest.fn(),
  writable: true,
});

// Mock the UI components
jest.mock("./ui/button", () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: React.PropsWithChildren<{
    onClick?: () => void;
    [key: string]: unknown;
  }>) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("./ui/input", () => ({
  Input: ({
    value,
    onChange,
    ...props
  }: {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    [key: string]: unknown;
  }) => <input value={value} onChange={onChange} {...props} />,
}));

jest.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({
    children,
    ...props
  }: React.PropsWithChildren<{ [key: string]: unknown }>) => (
    <div {...props}>{children}</div>
  ),
}));

// Mock PropertyCard component
jest.mock("@/src/app/(main-layout)/llm-search/PropertyCard", () => {
  return function MockPropertyCard({ listing }: { listing: { id: string } }) {
    return <div data-testid="property-card">{listing.id}</div>;
  };
});

describe("AISearchOverlay File Upload Feature", () => {
  const mockOnSubmit = jest.fn();
  const mockOnClose = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
  };

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnClose.mockClear();
  });

  it("renders file upload input", () => {
    render(<AISearchOverlay {...defaultProps} />);

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });

  it("has correct file upload attributes", () => {
    render(<AISearchOverlay {...defaultProps} />);

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute(
      "accept",
      ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.csv,.xlsx,.xls",
    );
    expect(fileInput).toHaveAttribute("multiple");
  });

  it("can upload a file", async () => {
    render(<AISearchOverlay {...defaultProps} />);

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    // Create a mock file
    const mockFile = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });

    // Simulate file upload
    Object.defineProperty(fileInput, "files", {
      value: [mockFile],
      writable: false,
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText("test.pdf")).toBeInTheDocument();
    });
  });

  it("calls onSubmit when form is submitted", async () => {
    mockOnSubmit.mockResolvedValue({ response: "Test response" });

    render(<AISearchOverlay {...defaultProps} />);

    const textInput = screen.getByPlaceholderText(/Ask me about properties/i);

    // Enter text and submit
    fireEvent.change(textInput, { target: { value: "Test message" } });
    fireEvent.submit(textInput.closest("form")!);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it("renders basic file upload interface", () => {
    render(<AISearchOverlay {...defaultProps} />);

    // Just verify the basic elements exist
    const fileInput = document.querySelector('input[type="file"]');
    const textInput = screen.getByPlaceholderText(/Ask me about properties/i);

    expect(fileInput).toBeInTheDocument();
    expect(textInput).toBeInTheDocument();
  });
});
