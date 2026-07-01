/* Starter complaint packs for Quick Ideas mode.
 *
 * Each market has 15–30 synthetic but realistic complaints. These are NOT real
 * market research — they are starter examples so beginners can explore the
 * Rift workflow without collecting their own data first.
 *
 * No real names, usernames, phone numbers, emails, addresses, or private
 * information. All complaints are clearly synthetic.
 */

export interface StarterPack {
  label: string;
  complaints: { title: string; body: string }[];
}

export type MarketKey =
  | "student-productivity"
  | "fitness-apps"
  | "local-bakeries"
  | "budgeting-apps"
  | "restaurant-booking"
  | "language-learning"
  | "small-business-software"
  | "beauty-salons";

export const MARKET_LABELS: Record<MarketKey, string> = {
  "student-productivity": "Student productivity",
  "fitness-apps": "Fitness apps",
  "local-bakeries": "Local bakeries",
  "budgeting-apps": "Budgeting apps",
  "restaurant-booking": "Restaurant booking",
  "language-learning": "Language learning",
  "small-business-software": "Small business software",
  "beauty-salons": "Beauty salons",
};

const STARTER_PACKS: Record<MarketKey, StarterPack> = {
  "student-productivity": {
    label: "Student productivity",
    complaints: [
      { title: "Cannot focus", body: "I keep getting distracted by my phone when I try to study and there is no built-in way to block apps during study sessions." },
      { title: "Messy notes", body: "My notes are scattered across five different apps and I can never find the right one when exam time comes." },
      { title: "No study plan", body: "I have exams in three weeks and I have no idea how to split the topics across the remaining days." },
      { title: "Revision overload", body: "I end up re-reading everything instead of focusing on what I actually do not understand." },
      { title: "Group projects are chaos", body: "Nobody in my group knows what they are supposed to do and there is no easy way to split tasks." },
      { title: "Deadlines invisible", body: "I keep missing assignment deadlines because I write them down in random places and forget to check." },
      { title: "PDF overload", body: "I download so many PDFs for class that I lose track of which ones I have actually read." },
      { title: "No progress tracking", body: "I study for hours but I have no way to see what topics I have covered and what is left." },
      { title: "Motivation crashes", body: "I start the semester strong but by week six I have no routine and everything piles up." },
      { title: "Flashcard mess", body: "Making flashcards takes forever and I end up with hundreds of cards I never actually review." },
      { title: "Too many tools", body: "I use one app for notes, another for tasks, another for flashcards, and none of them talk to each other." },
      { title: "Cannot prioritize", body: "I do not know which subject to study first so I just pick whatever feels easiest that day." },
      { title: "Study group scheduling", body: "Organizing a study session with classmates takes more time than the actual studying." },
      { title: "No spaced repetition", body: "I review a topic once and forget it a week later because there is no system to remind me." },
      { title: "Sleep schedule wrecked", body: "I stay up all night before exams because I did not spread the work across the semester." },
      { title: "Procrastination loop", body: "I know I should start studying but I keep putting it off until the panic sets in." },
      { title: "Resource overload", body: "There are too many YouTube videos, textbooks, and articles for every topic and I do not know which ones to trust." },
    ],
  },

  "fitness-apps": {
    label: "Fitness apps",
    complaints: [
      { title: "Generic workouts", body: "The app gives me the same beginner workout even though I have been lifting for two years." },
      { title: "No progress photos", body: "I want to track my body progress over time but the app only shows weight which does not tell the full story." },
      { title: "Calorie counting pain", body: "Logging every meal takes twenty minutes and I still do not know if my macros are right." },
      { title: "Workout too long", body: "Most workout plans assume I have an hour but I only have thirty minutes before work." },
      { title: "No home option", body: "Every plan wants me to use a gym but I work out at home with dumbbells and a mat." },
      { title: "Confusing interface", body: "There are so many tabs and menus that I cannot find the workout I am supposed to do today." },
      { title: "Recovery ignored", body: "The app does not tell me when to rest or stretch so I end up sore and unmotivated." },
      { title: "No community", body: "I want to share progress with friends but the app has no social features at all." },
      { title: "Subscription creep", body: "I signed up for a free trial and now I am paying fifteen dollars a month for features I never use." },
      { title: "Injury not accommodated", body: "I hurt my shoulder and the app still programs overhead presses with no alternative." },
      { title: "Sync problems", body: "My smartwatch data does not sync properly so my step count is always wrong." },
      { title: "No motivation", body: "The app sends generic reminders but nothing that actually makes me want to work out." },
      { title: "Meal plans useless", body: "The suggested meal plan includes ingredients I cannot find in my local grocery store." },
      { title: "Progress stalled", body: "I have been doing the same routine for three months and the app does not adjust when I stop seeing results." },
      { title: "Wearable overload", body: "I wear a watch, a chest strap, and a ring and none of them agree on how many calories I burned." },
      { title: "Body metrics missing", body: "I want to track body fat percentage and muscle mass but the app only tracks weight." },
    ],
  },

  "local-bakeries": {
    label: "Local bakeries",
    complaints: [
      { title: "Sold out by noon", body: "I get off work at noon and by the time I arrive everything good is already gone." },
      { title: "No online ordering", body: "I have to call to place an order and nobody ever picks up the phone." },
      { title: "Allergen info unclear", body: "My kid has a nut allergy and the bakery does not label which items contain nuts." },
      { title: "Cash only", body: "I walked in ready to buy a cake and they only take cash. I had to leave empty handed." },
      { title: "No delivery", body: "I wanted to order a birthday cake for delivery but they do not offer any delivery service." },
      { title: "Closed on Sundays", body: "The only bakery near me is closed on weekends which is when I actually have time to go." },
      { title: "Cake ordering confusing", body: "I tried to order a custom cake but nobody could tell me the price or how far in advance I need to book." },
      { title: "No dietary options", body: "There is nothing gluten-free on the menu and nobody seems to care." },
      { title: "Wait times too long", body: "There is always a fifteen minute wait just to order a coffee and a croissant." },
      { title: "No loyalty program", body: "I go there every single day and there is no reward for being a regular customer." },
      { title: "Inconsistent quality", body: "The sourdough is amazing one week and rock hard the next. There is no consistency." },
      { title: "No pre-order option", body: "I want to pre-order for pickup so I can skip the line but there is no way to do that." },
      { title: "Menu never changes", body: "They have had the exact same items for two years and I am getting bored." },
      { title: "No parking", body: "There is nowhere to park nearby so I have to circle the block for ten minutes every visit." },
      { title: "Packaging wasteful", body: "Every pastry comes in its own plastic box. I wish they had a simpler eco-friendly option." },
      { title: "Price transparency", body: "The menu board does not show prices for half the items and I feel awkward asking." },
    ],
  },

  "budgeting-apps": {
    label: "Budgeting apps",
    complaints: [
      { title: "Manual entry exhausting", body: "I have to type in every single transaction manually and I give up after a week." },
      { title: "Bank sync broken", body: "The app stopped syncing with my bank account three months ago and the support team never fixed it." },
      { title: "Too many categories", body: "There are fifty subcategories and I do not know which one to put my grocery spending in." },
      { title: "No shared budget", body: "My partner and I share expenses but the app is designed for one person only." },
      { title: "Confusing reports", body: "The monthly report shows a bunch of charts but does not tell me where I actually overspent." },
      { title: "No savings goals", body: "I want to set a goal for a vacation fund but the app only tracks spending, not saving." },
      { title: "Subscription tracking missing", body: "I know I am paying for things I do not use but the app does not show recurring charges clearly." },
      { title: "No bill reminders", body: "I keep forgetting to pay my electricity bill because the app does not send any reminders." },
      { title: "Overwhelming dashboard", body: "The main screen shows so much information that I do not know where to start." },
      { title: "No cash tracking", body: "Half my spending is in cash and the app makes it painful to log cash transactions." },
      { title: "Currency conversion wrong", body: "I travel frequently and the app converts everything to dollars at wrong rates." },
      { title: "No debt tracker", body: "I want to see my credit card debt go down over time but the app does not track balances." },
      { title: "Export impossible", body: "I tried to export my data for my accountant and the app does not support any export format." },
      { title: "Privacy concerns", body: "The app asks for my bank login details and I do not feel comfortable sharing that." },
      { title: "No yearly overview", body: "I can only see month by month but I want to know my total spending for the whole year." },
      { title: "Notifications spam", body: "The app sends me ten notifications a day about things I already know." },
      { title: "No envelope budgeting", body: "I want to allocate money into envelopes like rent, food, and fun but the app does not support that." },
    ],
  },

  "restaurant-booking": {
    label: "Restaurant booking",
    complaints: [
      { title: "No availability shown", body: "I have to call the restaurant just to find out if they have a table tonight." },
      { title: "Cancellation policy unclear", body: "I cancelled a reservation and still got charged a fee that was not mentioned when I booked." },
      { title: "No dietary filter", body: "I am vegetarian and I have to read every single menu to find out what I can actually eat." },
      { title: "Wait time guessing", body: "The app says the wait is fifteen minutes but I end up waiting forty-five." },
      { title: "No group booking", body: "Trying to book a table for twelve people is a nightmare. I have to call three different places." },
      { title: "Seating preference ignored", body: "I requested a window seat and got put next to the kitchen every single time." },
      { title: "Price info missing", body: "I want to know if a restaurant is expensive before I book but there is no price range indicator." },
      { title: "Reviews outdated", body: "The reviews are from two years ago and the restaurant has changed completely since then." },
      { title: "No loyalty perks", body: "I eat at the same restaurant every week and there is no benefit for being a repeat customer." },
      { title: "Reservation lost", body: "I showed up with a confirmed reservation and they had no record of my booking." },
      { title: "No takeout option", body: "I want to order takeout from the same place I dine at but I have to use a different app entirely." },
      { title: "Menu photos missing", body: "I want to see what the food actually looks like before I book but most restaurants have no photos." },
      { title: "Parking info absent", body: "I drive to a restaurant and there is nowhere to park. I wish the app told me about parking beforehand." },
      { title: "No pre-ordering", body: "I want to order my food before I arrive so it is ready when I sit down." },
      { title: "Kid-friendly info missing", body: "I have young children and I never know if a restaurant has a kids menu or high chairs." },
    ],
  },

  "language-learning": {
    label: "Language learning",
    complaints: [
      { title: "No speaking practice", body: "The app teaches me words but I never actually practice speaking them out loud." },
      { title: "Too repetitive", body: "I keep doing the same lessons over and over and I am not making any real progress." },
      { title: "Grammar ignored", body: "The app focuses on vocabulary but I have no idea how to put sentences together properly." },
      { title: "No real conversations", body: "I can translate phrases but I cannot hold a basic conversation with a real person." },
      { title: "Pronunciation feedback missing", body: "I say words out loud but the app does not tell me if my pronunciation is correct." },
      { title: "Too easy then too hard", body: "The first hundred lessons are trivially easy and then suddenly everything jumps to an impossible level." },
      { title: "No cultural context", body: "I am learning phrases but I have no idea when it is appropriate to use them in real life." },
      { title: "Streak pressure", body: "I feel forced to do a five minute lesson every day just to keep my streak and I am not actually learning." },
      { title: "No reading practice", body: "I want to read real articles in my target language but the app only shows textbook sentences." },
      { title: "Vocabulary not relevant", body: "I learned the word for elephant before I learned how to order food at a restaurant." },
      { title: "No writing exercises", body: "I want to practice writing sentences but the app only does multiple choice." },
      { title: "Audio quality poor", body: "The audio for some words sounds robotic and I cannot tell how they are actually pronounced." },
      { title: "No progress export", body: "I want to show my teacher what I have learned but there is no way to export my progress." },
      { title: "Too many notifications", body: "The app sends me reminders every hour and I end up turning off all notifications." },
      { title: "No dialect options", body: "I am learning Spanish but the app only teaches one accent and I need a different one." },
      { title: "Paid content wall", body: "I finally get into a good rhythm and then hit a paywall that blocks all the interesting content." },
    ],
  },

  "small-business-software": {
    label: "Small business software",
    complaints: [
      { title: "Too complicated", body: "I just need to send invoices but the software makes me set up a chart of accounts first." },
      { title: "Expensive for solo", body: "The cheapest plan is ninety nine dollars a month and I am a one person business." },
      { title: "No mobile app", body: "I run my business from my phone and there is no mobile app so I have to use the clunky website." },
      { title: "Customer support slow", body: "I submitted a ticket three days ago and still have not heard back from anyone." },
      { title: "Integrations missing", body: "The software does not integrate with my payment processor so I have to enter everything twice." },
      { title: "Reporting limited", body: "I want to see a simple profit and loss statement but the reports are too basic." },
      { title: "Too many features", body: "I only need invoicing and time tracking but the software bundles everything together and it is overwhelming." },
      { title: "No project management", body: "I need to track tasks for different clients but the software has no way to organize projects." },
      { title: "Contractor payments difficult", body: "Paying my contractors through the software is more complicated than just using bank transfer." },
      { title: "No client portal", body: "My clients want to see their invoices online but I have to email PDFs manually." },
      { title: "Tax prep nightmare", body: "At tax time I cannot export my data in a format my accountant can use." },
      { title: "Backup concerns", body: "I do not know if my data is backed up and there is no way to export it locally." },
      { title: "No time tracking", body: "I bill hourly but the software does not track time so I use a separate app and reconcile later." },
      { title: "Dashboard cluttered", body: "The main dashboard shows widgets for features I do not use and hides the ones I need." },
      { title: "Onboarding poor", body: "I signed up and had no idea where to start. The tutorial assumed I already knew accounting." },
    ],
  },

  "beauty-salons": {
    label: "Beauty salons",
    complaints: [
      { title: "No online booking", body: "I have to call during business hours to book an appointment and nobody ever answers." },
      { title: "Wait times too long", body: "I arrive on time for my appointment but end up waiting thirty minutes before someone helps me." },
      { title: "Price list hidden", body: "I want to know how much a haircut costs before I book but the salon does not post prices online." },
      { title: "No product info", body: "The stylist used a product on my hair but I cannot find it anywhere to buy for home use." },
      { title: "Same style every time", body: "I ask for something different but the stylist gives me the same cut because it is easier." },
      { title: "No availability on weekends", body: "I work Monday to Friday and the only time I can get an appointment is Saturday which is always booked." },
      { title: "Cancellation too strict", body: "I cancelled four hours before my appointment and they still charged me a fee." },
      { title: "No before and after photos", body: "I want to see examples of their work but they do not have a portfolio anywhere." },
      { title: "Parking difficult", body: "The salon is in a busy area with no parking and I end up circling for fifteen minutes." },
      { title: "Product upselling", body: "Every visit feels like a sales pitch for expensive products I do not need." },
      { title: "No kids services", body: "I need a salon that can handle my toddler but there is no kids menu or kid-friendly option." },
      { title: "Inconsistent results", body: "My color looks great one week and then fades completely within days." },
      { title: "Hygiene concerns", body: "The tools did not look clean and the towels smelled like they had not been washed." },
      { title: "No loyalty program", body: "I have been going to the same salon for years and there is no reward for my loyalty." },
      { title: "Staff turnover", body: "Every time I go there is a new stylist and I have to explain what I want all over again." },
      { title: "No walk-in policy clear", body: "I walked in without an appointment and was told to come back in two hours with no explanation." },
    ],
  },
};

/** Get a starter pack by market key. Returns undefined for unknown keys. */
export function getStarterPack(key: string): StarterPack | undefined {
  return STARTER_PACKS[key as MarketKey];
}

/** All available market keys. */
export const MARKET_KEYS = Object.keys(STARTER_PACKS) as MarketKey[];
