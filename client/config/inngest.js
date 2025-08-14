import { Inngest } from 'inngest';
// import { serve } from 'inngest/next';

// Create a client to send and receive events
export const inngest = new Inngest({ id: 'cartkoro-next' });

// Create an API that serves zero functions
// export default serve({
//   client: inngest,
//   functions: [
//     /* your functions will be passed here later! */
//   ],
// });
export const syncUserCreation = inngest.createFunction(
  {
    id: 'sync-user-from-clerk',
  },
  {
    event: 'clerk/user.created',
  },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } =
      event.data;
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: first_name + ' ' + last_name,
      imageUrl: image_url,
    };
  }
);
