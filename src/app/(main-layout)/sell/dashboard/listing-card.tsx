import Spinner from "@/src/components/ui/Spinner";

interface PropertyListing {
    id: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    property_type: string;
    bedrooms: number;
    bathrooms: number;
    listing_title?: string;
    monthly_rent?: number;
    listing_status?: string;
    listing_created?: string;
    square_footage?: number;
}

interface ListingCardProps {
    property: PropertyListing;
    onPropertyClick: (property: PropertyListing) => void;
    onEditClick: (e: React.MouseEvent) => void;
    onDeleteClick: (e: React.MouseEvent) => void;
    isLoading: boolean;
    formatAddress: (property: PropertyListing) => string;
    formatPrice: (price?: number) => string;
    getStatusBadge: (status?: string) => React.ReactNode;
    getActionText: (property: PropertyListing) => string;
}

export default function ListingCard({
    property,
    onPropertyClick,
    onEditClick,
    onDeleteClick,
    isLoading,
    formatAddress,
    formatPrice,
    getStatusBadge,
    getActionText,
}: ListingCardProps) {
    return (
        <div
            className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border ${
                isLoading ? "ring-2 ring-blue-500 ring-opacity-50" : ""
            }`}
            onClick={() => onPropertyClick(property)}
        >
            {/* Property Image Placeholder */}
            <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 rounded-t-lg flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-white font-bold text-lg">
                            {property.bedrooms}BR
                        </span>
                    </div>
                    <p className="text-blue-700 text-sm font-medium">
                        {property.property_type}
                    </p>
                </div>
            </div>

            {/* Card Content */}
            <div className="p-4">
                {/* Status Badge */}
                <div className="flex justify-between items-start mb-2">
                    {getStatusBadge(property.listing_status)}

                    {/* Action Buttons */}
                    <div className="flex space-x-1">
                        <button
                            onClick={onEditClick}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit property details"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                            </svg>
                        </button>
                        <button
                            onClick={onDeleteClick}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete property"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Property Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                    {property.listing_title || formatAddress(property)}
                </h3>

                {/* Address */}
                <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                    {formatAddress(property)}
                </p>

                {/* Property Details */}
                <div className="flex items-center text-sm text-gray-500 mb-3 space-x-4">
                    <span>{property.bedrooms} bed</span>
                    <span>{property.bathrooms} bath</span>
                    {property.square_footage && (
                        <span>{property.square_footage} sq ft</span>
                    )}
                </div>

                {/* Price */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-gray-900">
                        {formatPrice(property.monthly_rent)}
                        <span className="text-sm font-normal text-gray-500">
                            /month
                        </span>
                    </span>
                    {property.listing_created && (
                        <span className="text-xs text-gray-500">
                            Listed{" "}
                            {new Date(
                                property.listing_created
                            ).toLocaleDateString()}
                        </span>
                    )}
                </div>

                {/* Action Text */}
                <div className="flex items-center text-xs text-blue-600 font-medium">
                    {isLoading && (
                        <Spinner
                            size={12}
                            colorClass="text-blue-600"
                            className="mr-2"
                        />
                    )}
                    {isLoading ? "Loading..." : getActionText(property)}
                </div>
            </div>
        </div>
    );
}
