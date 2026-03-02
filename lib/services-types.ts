// MEGA SERVICES PLATFORM – shared types

// ─── Ride-Sharing ────────────────────────────────────────────────────────────
export type RideType = "economy" | "premium" | "xl" | "black" | "moto" | "pool";
export type RideStatus = "requested" | "matched" | "en_route" | "arrived" | "in_progress" | "completed" | "cancelled";

export interface RideRequest {
  id: string;
  passengerId: string;
  rideType: RideType;
  pickup: GeoLocation;
  dropoff: GeoLocation;
  status: RideStatus;
  driverId?: string;
  estimatedFare: number;
  surgeFactor: number;
  requestedAt: string;
  scheduledAt?: string;
}

export interface Driver {
  id: string;
  name: string;
  rating: number;
  totalTrips: number;
  vehicle: Vehicle;
  location: GeoLocation;
  isOnline: boolean;
  earnings: DriverEarnings;
}

export interface Vehicle {
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
  type: RideType;
}

export interface DriverEarnings {
  today: number;
  thisWeek: number;
  thisMonth: number;
  totalLifetime: number;
}

// ─── Flight Booking ───────────────────────────────────────────────────────────
export type CabinClass = "economy" | "premium_economy" | "business" | "first";
export type FlightStatus = "scheduled" | "boarding" | "departed" | "arrived" | "delayed" | "cancelled";

export interface FlightSearch {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass: CabinClass;
  flexible?: boolean;
}

export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  stops: number;
  price: number;
  cabinClass: CabinClass;
  seatsAvailable: number;
  status: FlightStatus;
  amenities: string[];
}

export interface FlightBooking {
  id: string;
  flightId: string;
  passengers: PassengerDetails[];
  seatNumbers: string[];
  totalPrice: number;
  baggageAllowance: BaggageOption;
  insurance?: TravelInsurance;
  status: "pending" | "confirmed" | "checked_in" | "completed" | "cancelled";
  pnr: string;
  createdAt: string;
}

export interface PassengerDetails {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber?: string;
  nationality?: string;
  specialRequests?: string;
}

export interface BaggageOption {
  carry_on: number;
  checked: number;
  weight: number;
}

export interface TravelInsurance {
  provider: string;
  policyNumber: string;
  coverage: string[];
  premium: number;
}

// ─── Food Delivery ────────────────────────────────────────────────────────────
export type OrderStatus = "placed" | "confirmed" | "preparing" | "ready" | "picked_up" | "delivered" | "cancelled";

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string[];
  rating: number;
  reviewCount: number;
  deliveryTime: number;
  deliveryFee: number;
  minimumOrder: number;
  isOpen: boolean;
  address: string;
  image?: string;
  menu: MenuCategory[];
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  calories?: number;
  allergens?: string[];
  isAvailable: boolean;
  image?: string;
  customizations?: MenuCustomization[];
}

export interface MenuCustomization {
  name: string;
  options: { label: string; priceModifier: number }[];
  required: boolean;
  multiSelect: boolean;
}

export interface FoodOrder {
  id: string;
  restaurantId: string;
  customerId: string;
  items: OrderItem[];
  deliveryAddress: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tip: number;
  total: number;
  estimatedDelivery: string;
  driverId?: string;
  placedAt: string;
  specialInstructions?: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  customizations?: string[];
}

// ─── Package Delivery ─────────────────────────────────────────────────────────
export type PackageSize = "envelope" | "small" | "medium" | "large" | "xl" | "freight";
export type DeliveryStatus = "scheduled" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "failed" | "returned";

export interface PackageDelivery {
  id: string;
  trackingNumber: string;
  senderId: string;
  recipientName: string;
  recipientPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  packageSize: PackageSize;
  weight: number;
  declaredValue: number;
  status: DeliveryStatus;
  deliveryPartnerId?: string;
  estimatedDelivery: string;
  proofOfDelivery?: ProofOfDelivery;
  insurance?: boolean;
  specialHandling?: string[];
  temperatureControl?: TemperatureControl;
  createdAt: string;
}

export interface ProofOfDelivery {
  signature?: string;
  photoUrl?: string;
  deliveredAt: string;
  deliveredTo: string;
  notes?: string;
}

export interface TemperatureControl {
  minTemp: number;
  maxTemp: number;
  unit: "C" | "F";
}

// ─── Rental Cars ──────────────────────────────────────────────────────────────
export type VehicleCategory = "economy" | "compact" | "midsize" | "fullsize" | "suv" | "luxury" | "van" | "truck" | "electric";

export interface RentalCar {
  id: string;
  make: string;
  model: string;
  year: number;
  category: VehicleCategory;
  seats: number;
  transmission: "automatic" | "manual";
  fuelType: "gasoline" | "diesel" | "electric" | "hybrid";
  dailyRate: number;
  isAvailable: boolean;
  location: string;
  mileageLimit: number;
  features: string[];
  gpsEnabled: boolean;
}

export interface CarRental {
  id: string;
  carId: string;
  customerId: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  dropoffDate: string;
  totalDays: number;
  basePrice: number;
  insurance: RentalInsurance;
  totalPrice: number;
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled";
  licenseVerified: boolean;
  damageReport?: DamageReport;
  createdAt: string;
}

export interface RentalInsurance {
  type: "basic" | "standard" | "premium";
  dailyCost: number;
  deductible: number;
  coverage: string[];
}

export interface DamageReport {
  reportedAt: string;
  description: string;
  photos: string[];
  estimatedCost: number;
  resolved: boolean;
}

// ─── Last-Mile Delivery ───────────────────────────────────────────────────────
export type DeliverySpeed = "standard" | "same_day" | "next_hour" | "scheduled";

export interface LastMileDelivery {
  id: string;
  orderId: string;
  customerId: string;
  deliveryAddress: string;
  geoLocation: GeoLocation;
  speed: DeliverySpeed;
  status: DeliveryStatus;
  courierId?: string;
  scheduledWindow?: { start: string; end: string };
  proofOfDelivery?: ProofOfDelivery;
  failedAttempts: number;
  geofenceRadius: number;
  batchId?: string;
  createdAt: string;
}

// ─── Logistics & Freight ─────────────────────────────────────────────────────
export type FreightMode = "ltl" | "ftl" | "rail" | "air" | "ocean" | "intermodal";

export interface FreightLoad {
  id: string;
  posterId: string;
  origin: string;
  destination: string;
  pickupDate: string;
  deliveryDate: string;
  weight: number;
  dimensions: Dimensions;
  mode: FreightMode;
  rate: number;
  isHazmat: boolean;
  requiresTemperatureControl: boolean;
  temperature?: TemperatureControl;
  tollsIncluded: boolean;
  status: "posted" | "booked" | "in_transit" | "delivered" | "cancelled";
  carrierId?: string;
  billOfLading?: BillOfLading;
  createdAt: string;
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: "in" | "cm";
}

export interface BillOfLading {
  number: string;
  issuedAt: string;
  shipper: string;
  consignee: string;
  commodityDescription: string;
  totalWeight: number;
  pieces: number;
}

// ─── Field Service & Maintenance ─────────────────────────────────────────────
export type ServiceCategory = "plumbing" | "electrical" | "hvac" | "appliance" | "carpentry" | "painting" | "cleaning" | "pest_control" | "landscaping" | "general";

export interface ServiceRequest {
  id: string;
  customerId: string;
  category: ServiceCategory;
  description: string;
  address: string;
  scheduledAt: string;
  urgency: "routine" | "urgent" | "emergency";
  status: "pending" | "assigned" | "in_progress" | "completed" | "cancelled";
  technicianId?: string;
  partsRequired?: Part[];
  laborHours?: number;
  invoice?: ServiceInvoice;
  photos?: string[];
  warrantyInfo?: WarrantyInfo;
  slaDeadline?: string;
  createdAt: string;
}

export interface Part {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitCost: number;
}

export interface ServiceInvoice {
  id: string;
  serviceRequestId: string;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  issuedAt: string;
  dueDate: string;
  paid: boolean;
}

export interface WarrantyInfo {
  provider: string;
  policyNumber: string;
  expiresAt: string;
  covered: boolean;
}

// ─── Shared ───────────────────────────────────────────────────────────────────
export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
}

// ─── Integrations ─────────────────────────────────────────────────────────────
export type IntegrationCategory =
  | "payment"
  | "mapping"
  | "communication"
  | "analytics"
  | "cloud"
  | "database"
  | "ai_ml"
  | "insurance"
  | "identity"
  | "logistics_api";

export interface Integration {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  isConnected: boolean;
  logoUrl?: string;
  docsUrl?: string;
}
