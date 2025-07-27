import { jest } from "@jest/globals";
import {
  decideChatOrFilter,
  getFilters,
  getPropertyListings,
  getChatResponse,
} from "../actions";
import { ChatMessage, PropertyFilters } from "../types";
import { createClient } from "../../../../../utils/supabase/server";

// Mock fetch globally
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Get the mocked createClient function
const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe("actions.ts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
  });

  describe("decideChatOrFilter", () => {
    const mockChatHistory: ChatMessage[] = [
      {
        text: "Hello, I am looking for an apartment",
        type: "user",
        timestamp: new Date("2024-01-01"),
      },
      {
        text: "I can help you find an apartment. What are your preferences?",
        type: "ai",
        timestamp: new Date("2024-01-01"),
      },
    ];

    const mockPrompt =
      "I need a 2-bedroom apartment in San Francisco under $3000";

    it('should return "search" when API responds with search action', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ action: "search" }),
      } as Partial<Response>;
      mockFetch.mockResolvedValue(mockResponse as Response);

      // Act
      const result = await decideChatOrFilter(mockChatHistory, mockPrompt);

      // Assert
      expect(result).toBe("search");
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/decide-action",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: mockPrompt,
            chatHistory: mockChatHistory,
          }),
        },
      );
    });

    it('should return "chat" when API responds with chat action', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ action: "chat" }),
      } as Partial<Response>;
      mockFetch.mockResolvedValue(mockResponse as Response);

      // Act
      const result = await decideChatOrFilter(mockChatHistory, mockPrompt);

      // Assert
      expect(result).toBe("chat");
    });

    it('should return "chat" when API responds with unknown action', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ action: "unknown" }),
      } as Partial<Response>;
      mockFetch.mockResolvedValue(mockResponse as Response);

      // Act
      const result = await decideChatOrFilter(mockChatHistory, mockPrompt);

      // Assert
      expect(result).toBe("chat");
    });

    it('should return "chat" when API request fails (not ok)', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 500,
      } as Partial<Response>;
      mockFetch.mockResolvedValue(mockResponse as Response);

      // Spy on console.error
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Act
      const result = await decideChatOrFilter(mockChatHistory, mockPrompt);

      // Assert
      expect(result).toBe("chat");
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to decide action, defaulting to chat",
      );

      // Cleanup
      consoleSpy.mockRestore();
    });

    it('should return "chat" when fetch throws an error', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error("Network error"));

      // Spy on console.error
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Act
      const result = await decideChatOrFilter(mockChatHistory, mockPrompt);

      // Assert
      expect(result).toBe("chat");
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error deciding action:",
        new Error("Network error"),
      );

      // Cleanup
      consoleSpy.mockRestore();
    });

    it("should work with empty chat history", async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ action: "search" }),
      } as Partial<Response>;
      mockFetch.mockResolvedValue(mockResponse as Response);

      // Act
      const result = await decideChatOrFilter([], mockPrompt);

      // Assert
      expect(result).toBe("search");
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/decide-action",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: mockPrompt,
            chatHistory: [],
          }),
        },
      );
    });

    it("should use custom base URL when NEXT_PUBLIC_BASE_URL is set", async () => {
      // Arrange
      const customBaseURL = "https://custom-domain.com";
      process.env.NEXT_PUBLIC_BASE_URL = customBaseURL;

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ action: "search" }),
      } as Partial<Response>;
      mockFetch.mockResolvedValue(mockResponse as Response);

      // Act
      await decideChatOrFilter(mockChatHistory, mockPrompt);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        `${customBaseURL}/api/decide-action`,
        expect.any(Object),
      );
    });
  });

  describe("getFilters", () => {
    const mockPrompt =
      "I need a 2-bedroom apartment in San Francisco under $3000 per month";
    const mockChatHistory: ChatMessage[] = [
      {
        text: "Hello",
        type: "user",
        timestamp: new Date("2024-01-01"),
      },
    ];

    it("should successfully fetch filters with chat history", async () => {
      // Arrange
      const mockFilters: PropertyFilters = {
        city: "San Francisco",
        bedrooms: 2,
        price_max: 3000,
        property_type: "apartment",
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockFilters),
      } as Partial<Response>;
      mockFetch.mockResolvedValue(mockResponse as Response);

      // Act
      const result = await getFilters(mockPrompt, mockChatHistory);

      // Assert
      expect(result).toEqual(mockFilters);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/query-to-filter",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: mockPrompt,
            chatHistory: mockChatHistory,
          }),
        },
      );
    });

    it("should successfully fetch filters without chat history", async () => {
      // Arrange
      const mockFilters: PropertyFilters = {
        city: "San Francisco",
        bedrooms: 2,
        price_max: 3000,
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockFilters),
      } as Partial<Response>;
      mockFetch.mockResolvedValue(mockResponse as Response);

      // Act
      const result = await getFilters(mockPrompt);

      // Assert
      expect(result).toEqual(mockFilters);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/query-to-filter",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: mockPrompt,
            chatHistory: undefined,
          }),
        },
      );
    });

    it("should throw error when API request fails", async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Partial<Response>;
      mockFetch.mockResolvedValue(mockResponse as Response);

      // Act & Assert
      await expect(getFilters(mockPrompt)).rejects.toThrow(
        "Failed to fetch data",
      );
    });

    it("should throw error when fetch fails", async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error("Network error"));

      // Act & Assert
      await expect(getFilters(mockPrompt)).rejects.toThrow("Network error");
    });

    it("should use custom base URL when NEXT_PUBLIC_BASE_URL is set", async () => {
      // Arrange
      const customBaseURL = "https://custom-domain.com";
      process.env.NEXT_PUBLIC_BASE_URL = customBaseURL;

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      } as Partial<Response>;
      mockFetch.mockResolvedValue(mockResponse as Response);

      // Act
      await getFilters(mockPrompt);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        `${customBaseURL}/api/query-to-filter`,
        expect.any(Object),
      );
    });
  });

  describe("getChatResponse", () => {
    const mockPrompt = "Tell me about apartment hunting tips";
    const mockChatHistory: ChatMessage[] = [
      {
        text: "Hello",
        type: "user",
        timestamp: new Date("2024-01-01"),
      },
    ];

    it("should successfully get chat response", async () => {
      // Arrange
      const mockChatData = {
        message: "Here are some apartment hunting tips...",
        type: "ai",
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockChatData),
      } as Partial<Response>;
      mockFetch.mockResolvedValue(mockResponse as Response);

      // Act
      const result = await getChatResponse(mockChatHistory, mockPrompt);

      // Assert
      expect(result).toEqual(mockChatData);
      expect(mockFetch).toHaveBeenCalledWith("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: mockPrompt,
          chatHistory: mockChatHistory,
        }),
      });
    });

    it("should throw error when API request fails", async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Partial<Response>;
      mockFetch.mockResolvedValue(mockResponse as Response);

      // Act & Assert
      await expect(
        getChatResponse(mockChatHistory, mockPrompt),
      ).rejects.toThrow("Failed to get chat response");
    });

    it("should throw error when fetch fails", async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error("Network error"));

      // Act & Assert
      await expect(
        getChatResponse(mockChatHistory, mockPrompt),
      ).rejects.toThrow("Network error");
    });

    it("should use custom base URL when NEXT_PUBLIC_BASE_URL is set", async () => {
      // Arrange
      const customBaseURL = "https://custom-domain.com";
      process.env.NEXT_PUBLIC_BASE_URL = customBaseURL;

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      } as Partial<Response>;
      mockFetch.mockResolvedValue(mockResponse as Response);

      // Act
      await getChatResponse(mockChatHistory, mockPrompt);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        `${customBaseURL}/api/chat`,
        expect.any(Object),
      );
    });
  });

  describe("getPropertyListings", () => {
    let mockSupabaseClient: {
      from: jest.MockedFunction<any>;
    };
    let mockQuery: {
      select: jest.MockedFunction<any>;
      eq: jest.MockedFunction<any>;
      ilike: jest.MockedFunction<any>;
      gte: jest.MockedFunction<any>;
      lte: jest.MockedFunction<any>;
      limit: jest.MockedFunction<any>;
    };

    beforeEach(() => {
      // Create fresh mock objects for each test
      mockQuery = {
        select: jest.fn(),
        eq: jest.fn(),
        ilike: jest.fn(),
        gte: jest.fn(),
        lte: jest.fn(),
        limit: jest.fn(),
      };

      mockSupabaseClient = {
        from: jest.fn().mockReturnValue(mockQuery),
      };

      // Set up the method chaining for supabase query
      mockQuery.select.mockReturnValue(mockQuery);
      mockQuery.eq.mockReturnValue(mockQuery);
      mockQuery.ilike.mockReturnValue(mockQuery);
      mockQuery.gte.mockReturnValue(mockQuery);
      mockQuery.lte.mockReturnValue(mockQuery);
      mockQuery.limit.mockReturnValue({ data: [], error: null });

      // Update the mocked createClient to return our mock
      (mockCreateClient as jest.MockedFunction<any>).mockResolvedValue(
        mockSupabaseClient as any,
      );
    });

    it("should fetch property listings with basic filters", async () => {
      // Arrange
      const filters: PropertyFilters = {
        city: "San Francisco",
        bedrooms: 2,
        price_max: 3000,
      };

      const mockDatabaseResponse = [
        {
          id: "listing-1",
          monthly_rent: 2500,
          security_deposit: 2500,
          available_date: "2024-02-01",
          listing_title: "Beautiful 2BR Apartment",
          listing_description: "Spacious apartment in downtown",
          virtual_tour_url: "https://example.com/tour",
          listing_status: "active",
          properties: {
            id: "prop-1",
            address_line_1: "123 Main St",
            address_line_2: "Apt 4B",
            city: "San Francisco",
            state: "CA",
            zip_code: "94102",
            property_type: "apartment",
            bedrooms: 2,
            bathrooms: 1.5,
            square_footage: 850,
            parking_spaces: 1,
          },
        },
      ];

      mockQuery.limit.mockReturnValue({
        data: mockDatabaseResponse,
        error: null,
      });

      // Act
      const result = await getPropertyListings(filters);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "listing-1",
        monthlyRent: "2500",
        securityDeposit: "2500",
        availableDate: "2024-02-01",
        listingTitle: "Beautiful 2BR Apartment",
        listingDescription: "Spacious apartment in downtown",
        virtualTourUrl: "https://example.com/tour",
        property: {
          id: "prop-1",
          addressLine1: "123 Main St",
          addressLine2: "Apt 4B",
          city: "San Francisco",
          state: "CA",
          zipCode: "94102",
          propertyType: "apartment",
          bedrooms: 2,
          bathrooms: "1.5",
          squareFootage: 850,
          parkingSpaces: 1,
        },
      });

      // Verify query was built correctly
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("property_listings");
      expect(mockQuery.eq).toHaveBeenCalledWith("listing_status", "active");
      expect(mockQuery.ilike).toHaveBeenCalledWith(
        "properties.city",
        "%San Francisco%",
      );
      expect(mockQuery.eq).toHaveBeenCalledWith("properties.bedrooms", 2);
      expect(mockQuery.lte).toHaveBeenCalledWith("monthly_rent", 3000);
    });

    it("should handle empty results", async () => {
      // Arrange
      const filters: PropertyFilters = {
        city: "NonexistentCity",
      };

      mockQuery.limit.mockReturnValue({
        data: [],
        error: null,
      });

      // Act
      const result = await getPropertyListings(filters);

      // Assert
      expect(result).toEqual([]);
    });

    it("should handle null data response", async () => {
      // Arrange
      const filters: PropertyFilters = {
        city: "San Francisco",
      };

      mockQuery.limit.mockReturnValue({
        data: null,
        error: null,
      });

      // Act
      const result = await getPropertyListings(filters);

      // Assert
      expect(result).toEqual([]);
    });

    it("should throw error when database query fails", async () => {
      // Arrange
      const filters: PropertyFilters = {
        city: "San Francisco",
      };

      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockQuery.limit.mockReturnValue({
        data: null,
        error: { message: "Database connection failed" },
      });

      // Act & Assert
      await expect(getPropertyListings(filters)).rejects.toThrow(
        "Failed to fetch property listings",
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching property listings:",
        { message: "Database connection failed" },
      );

      consoleSpy.mockRestore();
    });

    it("should apply all available filters correctly", async () => {
      // Arrange
      const filters: PropertyFilters = {
        city: "San Francisco",
        state: "CA",
        property_type: "apartment",
        bedrooms: 2,
        bathrooms: 1,
        square_footage: 800,
        parking_spaces: 1,
        price_min: 2000,
        price_max: 3000,
        available_from: "2024-01-01",
      };

      mockQuery.limit.mockReturnValue({
        data: [],
        error: null,
      });

      // Act
      await getPropertyListings(filters);

      // Assert - Verify all filters were applied
      expect(mockQuery.ilike).toHaveBeenCalledWith(
        "properties.city",
        "%San Francisco%",
      );
      expect(mockQuery.ilike).toHaveBeenCalledWith("properties.state", "%CA%");
      expect(mockQuery.eq).toHaveBeenCalledWith(
        "properties.property_type",
        "apartment",
      );
      expect(mockQuery.eq).toHaveBeenCalledWith("properties.bedrooms", 2);
      expect(mockQuery.gte).toHaveBeenCalledWith("properties.bathrooms", 1);
      expect(mockQuery.gte).toHaveBeenCalledWith(
        "properties.square_footage",
        800,
      );
      expect(mockQuery.gte).toHaveBeenCalledWith(
        "properties.parking_spaces",
        1,
      );
      expect(mockQuery.gte).toHaveBeenCalledWith("monthly_rent", 2000);
      expect(mockQuery.lte).toHaveBeenCalledWith("monthly_rent", 3000);
      expect(mockQuery.gte).toHaveBeenCalledWith(
        "available_date",
        "2024-01-01",
      );
    });

    it("should handle missing property data gracefully", async () => {
      // Arrange
      const filters: PropertyFilters = {
        city: "San Francisco",
      };

      const mockDatabaseResponse = [
        {
          id: "listing-1",
          monthly_rent: null,
          security_deposit: null,
          available_date: null,
          listing_title: null,
          listing_description: null,
          virtual_tour_url: null,
          listing_status: "active",
          properties: null,
        },
      ];

      mockQuery.limit.mockReturnValue({
        data: mockDatabaseResponse,
        error: null,
      });

      // Act
      const result = await getPropertyListings(filters);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "listing-1",
        monthlyRent: "0",
        securityDeposit: undefined,
        availableDate: null,
        listingTitle: null,
        listingDescription: null,
        virtualTourUrl: null,
        property: {
          id: "",
          addressLine1: "",
          addressLine2: undefined,
          city: "",
          state: "",
          zipCode: "",
          propertyType: "",
          bedrooms: 0,
          bathrooms: "0",
          squareFootage: undefined,
          parkingSpaces: 0,
        },
      });
    });

    it("should apply limit of 20 results", async () => {
      // Arrange
      const filters: PropertyFilters = {
        city: "San Francisco",
      };

      mockQuery.limit.mockReturnValue({
        data: [],
        error: null,
      });

      // Act
      await getPropertyListings(filters);

      // Assert
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
    });
  });
});
