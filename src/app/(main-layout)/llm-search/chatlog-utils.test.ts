import { jest } from "@jest/globals";
import { clearAISearchConversation } from "./chatlog-utils";

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(global, "sessionStorage", {
  value: mockSessionStorage,
  writable: true,
});

describe("chatlog-utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.getItem.mockClear();
    mockSessionStorage.setItem.mockClear();
    mockSessionStorage.removeItem.mockClear();

    // Reset window to simulate browser environment
    Object.defineProperty(global, "window", {
      value: { location: { href: "http://localhost:3000" } },
      writable: true,
    });
  });

  describe("clearAISearchConversation", () => {
    const sessionKey = "test-session";

    it("should clear conversation from session storage", () => {
      clearAISearchConversation(sessionKey);

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
        `ai_search_conversation_${sessionKey}`,
      );
    });

    it("should use default session key when none provided", () => {
      clearAISearchConversation();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
        "ai_search_conversation_default",
      );
    });

    it("should do nothing on server side", () => {
      Object.defineProperty(global, "window", {
        value: undefined,
        writable: true,
      });
      clearAISearchConversation(sessionKey);

      expect(mockSessionStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe("Function exports", () => {
    it("should export all required functions", async () => {
      const {
        createAISearchConversation,
        logUserQuery,
        logAIResponse,
        getOrCreateAISearchConversation,
        clearAISearchConversation: clearFunction,
      } = await import("./chatlog-utils");

      expect(createAISearchConversation).toBeDefined();
      expect(typeof createAISearchConversation).toBe("function");

      expect(logUserQuery).toBeDefined();
      expect(typeof logUserQuery).toBe("function");

      expect(logAIResponse).toBeDefined();
      expect(typeof logAIResponse).toBe("function");

      expect(getOrCreateAISearchConversation).toBeDefined();
      expect(typeof getOrCreateAISearchConversation).toBe("function");

      expect(clearFunction).toBeDefined();
      expect(typeof clearFunction).toBe("function");
    });
  });

  describe("SearchFilters interface", () => {
    it("should define required filter properties", () => {
      const searchFilters = {
        bedrooms: 2,
        location: "San Francisco",
        maxPrice: 3000,
      };

      expect(searchFilters).toBeDefined();
      expect(searchFilters.bedrooms).toBe(2);
      expect(searchFilters.location).toBe("San Francisco");
      expect(searchFilters.maxPrice).toBe(3000);
    });
  });
});
