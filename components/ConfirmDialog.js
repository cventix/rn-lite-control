import React from 'react';
import {
  Dialog,
  Portal,
  // DialogTitle,
  // DialogContent,
  Paragraph,
  // DialogActions,
  Button,
} from 'react-native-paper';

const ConfirmDialog = ({
  item,
  visible,
  onShow,
  onSubmit,
  title,
  text,
  submitText,
  isSubmitting,
}) => (
  <Portal>
    <Dialog visible={visible} onDismiss={onShow}>
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Content>
        <Paragraph>{text}</Paragraph>
      </Dialog.Content>
      <Dialog.Actions>
        {!isSubmitting && <Button onPress={onShow}>CANCEL</Button>}
        <Button
          primary
          onPress={() => onSubmit(item)}
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          {!isSubmitting && submitText}
        </Button>
      </Dialog.Actions>
    </Dialog>
  </Portal>
);

export default ConfirmDialog;
