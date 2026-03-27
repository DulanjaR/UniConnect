import { Notification } from '../models/Notification.js';

export const createNotification = async ({
  receiver,
  sender,
  post,
  comment,
  group,
  groupMessage,
  type,
  message
}) => {
  if (!receiver || !sender || receiver.toString() === sender.toString()) {
    return null;
  }

  return Notification.create({
    receiver,
    sender,
    post,
    comment,
    group,
    groupMessage,
    type,
    message
  });
};
