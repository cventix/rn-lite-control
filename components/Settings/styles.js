//
// File: components/Settings/styles.js
//

import theme from '../../utils/theme';

export default {
  flexOne: {
    flex: 1,
  },
  colors: {
    error: '#ff0033',
  },
  container: {
    flex: 1,
    // backgroundColor: theme.colors.light,
  },
  content: {
    // flex: 1,
    padding: 10,
    backgroundColor: theme.colors.paper,
  },
  modal: {
    margin: 10,
  },
  modalContainer: {
    borderRadius: 3,
    backgroundColor: '#fff',
    padding: 3,
  },
  iconContainer: {
    width: 40,
  },
  text: {
    marginHorizontal: 10,
  },
  placeholder: {
    alignItems: 'flex-end',
    flex: 1,
  },
  placeholderText: {
    color: theme.colors.secondaryText,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.paper,
    paddingLeft: 5,
    paddingRight: 0,
    paddingTop: 15,
    paddingBottom: 15,
  },
  buttonRow: {
    backgroundColor: theme.colors.paper,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  spacer: {
    height: 10,
    backgroundColor: theme.colors.light,
  },
  saveBtn: {
    marginBottom: 20,
  },
  listBtn: {
    marginVertical: 20,
  },
  title: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  pickerItem: {
    fontSize: 16,
  },
};
