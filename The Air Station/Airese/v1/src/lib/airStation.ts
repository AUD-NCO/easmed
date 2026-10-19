/**
 * The Air Station: the sleep care team behind Airese ("Powered by The Air Station").
 *
 * PLACEHOLDERS for the prototype. Easmed to supply the real support number, hours and centre
 * details before release. Nothing here should be shown to users as real until then.
 */
export const SUPPORT = {
  phone: '+10000000000', // dialled by "Call us for help" (tel:)
  hours: 'Monday to Saturday, 9 am to 6 pm',
};

export type Centre = { id: string; name: string; area: string; address: string; hours: string; phone: string };

export const CENTRES: Centre[] = [
  { id: 'central', name: 'The Air Station', area: 'City Centre', address: 'Address to come', hours: 'Monday to Saturday, 9 am to 6 pm', phone: SUPPORT.phone },
  { id: 'north', name: 'The Air Station', area: 'North', address: 'Address to come', hours: 'Monday to Friday, 10 am to 7 pm', phone: SUPPORT.phone },
  { id: 'west', name: 'The Air Station', area: 'West', address: 'Address to come', hours: 'Tuesday to Saturday, 9 am to 5 pm', phone: SUPPORT.phone },
];

/** A maps search for a centre (Apple Maps on iOS opens it too). */
export const directionsUrl = (c: Centre) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.name} ${c.area} ${c.address}`)}`;
