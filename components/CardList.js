//
// File: components/CardList.js
//
import React from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import {
  Divider,
  Subheading,
  Button,
  Card,
  // CardActions,
  // CardContent,
  Title,
  Paragraph,
  // ToolbarAction,
  Appbar
} from 'react-native-paper';
import Menu, { MenuItem } from 'react-native-material-menu';

// import withPreventDoubleClick from './withPreventDoubleClick';

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    flex: 1,
  },
  text: {
    marginLeft: 10,
  },
  headingText: {
    fontSize: 14,
  },
  heading: {
    // fontWeight: 'bold',
    height: 48,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  spacerTop: {
    marginTop: 20,
  },
  card: {},
  cardTitle: {
    fontSize: 16,
    lineHeight: 20,
  },
  cardDetail: {
    lineHeight: 20,
  },
  cardContent: {},
  cardActions: {
    alignSelf: 'flex-end',
    marginTop: -5,
  },
  iconContainer: {
    width: 72 - 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  menu: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 5,
    top: 5,
  },
});

// const Touchable = withPreventDoubleClick(Button);
const Touchable = Button;

class CardListItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: [],
    };
    this.menu = null;
    this.visible = true;
  }

  componentDidMount() {
    this.visible = true;
  }

  componentWillUnmount() {
    this.visible = false;
  }

  setMenuRef = (ref) => {
    this.menu = ref;
  };

  setLoading = (actionIndex) => {
    if (!this.visible) return;
    const loadingItems = this.state.loading.slice();
    loadingItems.push(actionIndex);
    this.setState({ loading: loadingItems });
  };
  stopLoading = (actionIndex) => {
    if (!this.visible) return;
    const loadingItems = this.state.loading.slice();
    const pos = loadingItems.indexOf(actionIndex);
    loadingItems.splice(pos, 1);
    this.setState({ loading: loadingItems });
  };
  isLoading = actionIndex => this.state.loading.indexOf(actionIndex) !== -1;

  showMenu = () => {
    this.menu.show();
  };

  hideMenu = () => {
    this.menu.hide();
  };

  render() {
    const {
      item, actions, title, detail, theme, icon,
    } = this.props;

    let submenu = null;
    const mainActions = [...actions];
    if (mainActions.length > 2) {
      submenu = mainActions.splice(2);
    }

    return (
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          {submenu && (
            <View style={styles.menu}>
              <Menu
                ref={this.setMenuRef}
                button={
                  <Appbar.Action
                    onPress={this.showMenu}
                    icon="dots-vertical"
                    style={{
                      width: 48,
                      height: 48,
                      alignItems: 'flex-end',
                      marginTop: 0,
                      marginRight: 0,
                    }}
                  />
                }
              >
                {submenu.map((a, i) => (
                  <MenuItem
                    key={i}
                    onPress={() => {
                      a.onPress(item);
                      this.hideMenu();
                    }}
                  >
                    {a.text}
                  </MenuItem>
                ))}
              </Menu>
            </View>
          )}
          <View style={styles.row}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <View>
              <Title style={styles.cardTitle}>{title}</Title>
              {detail && <Paragraph style={styles.cardDetail}>{detail}</Paragraph>}
            </View>
          </View>
        </Card.Content>

        <Card.Actions style={styles.cardActions}>
          {mainActions.map((a, i) => (
            <Touchable
              key={i}
              onPress={async () => {
                if (!this.isLoading(i)) {
                  this.setLoading(i);
                  await a.onPress(item);
                  this.stopLoading(i);
                }
              }}
              primary={a.primary}
              theme={{ colors: { primary: theme.colors.accent } }}
              compact
              loading={this.isLoading(i)}
            >
              {`${a.text}`}
            </Touchable>
          ))}
        </Card.Actions>
      </Card>
    );
  }
}

const keyExtractor = (item, index) => {
  if (item.key) {
    return `${item.key}`;
  }
  return `${index}${item.id}`;
};

const renderSeparator = (sectionId, rowId) => <Divider key={rowId} />;

const renderHeading = (theme, title) => (
  <View style={[styles.heading, { backgroundColor: theme.colors.paper }]}>
    <Subheading style={[styles.text, styles.headingText, { color: theme.colors.secondaryText }]}>
      {title}
    </Subheading>
  </View>
);

const renderEmpty = (theme, isLoading, emptyText, loadingText) => {
  let title = emptyText || 'There are no items yet.';
  if (isLoading) {
    title = loadingText || 'Searching for devices...';
  }

  return (
    <Subheading style={[styles.text, styles.spacerTop, { color: theme.colors.secondaryText }]}>
      {title}
    </Subheading>
  );
};

const CardList = ({
  items,
  theme,
  title,
  itemTitlePrefix,
  itemTitlePostfix,
  emptyText,
  loadingText,
  itemDetailTemplate,
  isLoading,
  onRefresh,
  isRefreshing,
  actions,
  icon,
}) => (
  <FlatList
    style={[styles.flexOne, { backgroundColor: theme.colors.light }]}
    data={items}
    renderItem={({ item }) => (
      <CardListItem
        isLoading={isLoading}
        item={item}
        title={(itemTitlePrefix ? `${itemTitlePrefix} ` : '') + item.name + (itemTitlePostfix ? ` ${itemTitlePostfix(item)}` : '')}
        detail={itemDetailTemplate(item)}
        actions={actions(item)}
        icon={icon(item)}
        theme={theme}
      />
    )}
    ListEmptyComponent={renderEmpty(theme, isLoading, emptyText, loadingText)}
    ListHeaderComponent={title && renderHeading(theme, title)}
    // ItemSeparatorComponent={renderSeparator}
    keyExtractor={keyExtractor}
    onRefresh={onRefresh}
    refreshing={isRefreshing}
  />
);

export default CardList;
