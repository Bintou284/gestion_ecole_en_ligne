import amqp from 'amqplib';

export async function sendNotificationEvent(eventData: { userId: number; message: string; redirectLink: string }) {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await connection.createChannel();
    const queue = 'notifications';

    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(eventData)), { persistent: true });
    console.log('Message envoyé vers la queue notifications:', eventData);

    setTimeout(() => {
      connection.close();
    }, 500);
  } catch (error) {
    console.error('Erreur producteur RabbitMQ:', error);
  }
}
 

export async function notifyUsers(
  users: Array<{ user_id: number }>,
  message: string,
  redirectLink: string
) {
  for (const user of users) {
    try {
      await sendNotificationEvent({
        userId: user.user_id,
        message,
        redirectLink
      });
    } catch (e) {
      console.error(`Erreur notification pour l’utilisateur ${user.user_id}`, e);
    }
  }
}