import amqp from 'amqplib';
import { PrismaClient } from '@prisma/client';
import { pathToFileURL } from 'url';

const prisma = new PrismaClient();

export async function startConsumer() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await connection.createChannel();
    const queue = 'notifications';

    await channel.assertQueue(queue, { durable: true });
    console.log('Consumer lancé, écoute la queue:', queue);

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        try {
          const data = JSON.parse(msg.content.toString());
          const user = await prisma.users.findUnique({ where: { user_id: data.userId } });
          if (!user) {
            console.error(`Utilisateur inexistant ,notification ignorée ! | user_id: ${data.userId} | data:`, data);
            return channel.ack(msg); 
          }
          await prisma.notification.create({
            data: {
              userId: data.userId,
              message: data.message,
              read: false,
              redirectLink: data.redirectLink
            }
          });
          console.log('Notification créée :', data);
          channel.ack(msg); 
        } catch (error) {
          console.error("Erreur dans le traitement du message :", error);
          channel.ack(msg);
        }
      }
    });
  } catch (error) {
    console.error('Erreur consumer RabbitMQ:', error);
  } 
}

if (process.argv[1]) {
  if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    startConsumer();
  }
}


