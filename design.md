# EMEFast AI — Product & UI Specification

## Scope
EMEFast AI is an emergency hospital recommendation and coordination platform. It does **not** dispatch ambulances. The ambulance driver drives; the medical/management person travelling with the patient uses EMEFast to assess the case, query multiple hospitals, receive accept/decline responses, compare accepted hospitals, select a destination and send an ER pre-alert.

## Primary workflow
1. Assess patient
2. Record voice note / transcript
3. Capture verified location
4. Select clinical requirements
5. Open one emergency case
6. Query multiple verified hospitals within the configured radius
7. Hospitals accept or decline with reason
8. Compare accepted hospitals by eligibility, ETA and estimated cost
9. Show Best Overall, Fastest and Cheapest
10. Coordinator selects a hospital
11. Send ER pre-alert

## UI
- Matte black foundation
- Selective adaptive Liquid Glass surfaces
- Rounded 28px content cards
- SF Pro-style system typography with fallbacks
- Emergency red reserved for critical states/actions
- Spring-like tab and sheet transitions
- Safe-area aware mobile PWA layout
- Reduced-motion and keyboard/screen-reader states

## Recommendation rules
Required clinical capability and current availability are hard eligibility gates. ETA and estimated emergency cost are comparison factors only. A cheaper or closer hospital cannot become eligible when it lacks a required capability.

## Hospital response
Each queried hospital receives patient condition, requirements, location/ETA context and permitted health information. The ER desk can Accept or Decline. Declines require a reason.

## Out of scope
- Ambulance dispatch
- Silent SMS transmission from a browser
- Guaranteed iOS background GPS
- Arbitrary Dynamic Island rendering from a web PWA
- Production ABDM record access without approved credentials/consent integration
