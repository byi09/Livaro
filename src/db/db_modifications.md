1. Create apartment_buildings table

   ```sql
   CREATE TABLE apartment_buildings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    landlord_id uuid NOT NULL REFERENCES landlords(id),

    -- Building identification
    building_name text NOT NULL,
    building_number text,

    -- Address (Building level address)
    address_line_1 text NOT NULL,
    address_line_2 text,
    city text NOT NULL,
    state text NOT NULL,
    zip_code text NOT NULL,
    country text DEFAULT 'United States',

    -- Coordinates
    latitude decimal(10, 8),
    longitude decimal(11, 8),

    -- Building details
    year_built integer,
    total_units integer,
    total_floors integer,
    building_type text,

    -- Building description and amenities
    description text,
    parking_spaces integer DEFAULT 0,

    -- Management info
    management_company text,
    on_site_manager boolean DEFAULT false,

    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
   );
   ```

2. Create building_amenities table:

   ```sql
   CREATE TABLE public.building_amenities (
    id uuid primary key default gen_random_uuid(),
    building_id uuid not null references public.apartment_buildings(id) on delete cascade,
    amenity_name text not null,
    amenity_category text,
    amenity_description text,
    created_at timestamp with time zone default now()
   );
   ```

3. Create building_images table:

   ```sql
   CREATE TABLE public.building_images (
    id uuid primary key default gen_random_uuid(),
    building_id uuid not null references public.apartment_buildings(id) on delete cascade,
    s3_key text not null,
    image_order integer default 0,
    alt_text text,
    is_primary boolean default false,
    image_type text,
    created_at timestamp with time zone default now()
   );
   ```

4. Modifying properties table to include a `buildingId` foreign key to refer to the corresponding entry in the apartmentBuildings table.

   ```sql
   ALTER TABLE public.properties
    ALTER COLUMN landlord_id DROP NOT NULL,
    ADD COLUMN buildingId uuid,
    ADD CONSTRAINT properties_buildingId_apartment_buildings_id_fkey FOREIGN KEY (buildingId) REFERENCES public.apartment_buildings(id) ON DELETE CASCADE;

    CREATE INDEX idx_properties_buildingId ON public.properties(buildingId);
   ```
