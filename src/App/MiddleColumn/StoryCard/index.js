import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import deepEqual from 'deep-eql';
import { track } from '../../../EventTracker';
// eslint-disable-next-line
import {
  StoryBody,
  StoryFooter,
  Name,
  JoinTheConvo,
  MessageCount,
  Title,
  UnreadCount,
  LinkPreviewContainer,
  PhotosContainer,
  PhotoContainer,
  Photo,
  PhotoPlaceholder,
  HeadsContainer,
  StatusBar,
  StatusText,
  Dot,
} from './style';
import Markdown from 'react-remarkable';
import { openGallery } from '../../../actions/gallery';
import { timeDifference, hashToArray } from '../../../helpers/utils';
import Card from '../../../shared/Card';
import ParticipantHeads from './ParticipantHeads';
import LinkPreview from '../../../shared/LinkPreview';

const canBeBool = (...types) => PropTypes.oneOfType([PropTypes.bool, ...types]);

class StoryCard extends Component {
  constructor() {
    super();

    this.state = {
      photos: [],
    };
  }
  static propTypes = {
    isActive: PropTypes.bool,
    isNew: PropTypes.bool,
    link: PropTypes.string.isRequired,
    messages: canBeBool(PropTypes.number),
    metaLink: canBeBool(PropTypes.string),
    metaText: canBeBool(PropTypes.string),
    person: PropTypes.shape({
      name: PropTypes.string.isRequired,
      photo: PropTypes.string.isRequired,
    }),
    timestamp: PropTypes.number,
    title: PropTypes.string.isRequired,
    unreadMessages: PropTypes.number,
    participants: PropTypes.object,
    metadata: PropTypes.object,
    story: PropTypes.object.isRequired,
  };

  componentWillMount = () => {
    const { metadata, story } = this.props;
    if (metadata && metadata.photos && !story.deleted) {
      let photoKeys = hashToArray(metadata.photos);
      this.setState({
        photos: photoKeys,
      });
    }
  };

  shouldComponentUpdate = (nextProps, nextState) => {
    return !deepEqual(this.props, nextProps) ||
      !deepEqual(this.state, nextState);
  };

  componentWillUpdate = nextProps => {
    if (nextProps.metadata !== this.props.metadata) {
      if (nextProps.metadata && !nextProps.story.deleted) {
        let photoKeys = hashToArray(nextProps.metadata.photos);
        this.setState({
          photos: photoKeys,
        });
      }
    }
  };

  openGallery = (e, story) => {
    this.props.dispatch(openGallery(e, story));
  };

  handleClick = (e, url) => {
    e.preventDefault();

    track('link preview', 'clicked', url);
    window.open(url, '_blank');
  };

  render() {
    const {
      isActive,
      isNew,
      link,
      messages,
      metaLink,
      metaText,
      person,
      timestamp,
      title,
      unreadMessages,
      participants,
      user,
      metadata,
      frequencies: { active },
      story,
    } = this.props;

    let heads;

    // if the story has at least 3 participants
    if (
      participants &&
      Object.keys(participants).length >= 0 &&
      active !== 'everything'
    ) {
      if (
        !Object.keys(participants).every(participant => user.list[participant])
      ) {
        heads = <ParticipantHeads loading />;
      } else {
        heads = (
          <ParticipantHeads
            me={user.uid}
            unread={unreadMessages}
            participants={participants}
            list={user.list}
          />
        );
      }
    }

    let status;
    status = 'default';
    isActive ? status = 'active' : null;
    isNew ? status = 'new' : null;
    unreadMessages > 0 ? status = 'unread' : null;

    let hasMetadata = metadata ? true : false;
    let hasLinkPreview = hasMetadata && metadata.linkPreview ? true : false;
    let hasPhotos = hasMetadata && metadata.photos ? true : false;
    let photos = hasMetadata && metadata.photos ? metadata.photos : null;
    let photosArray = photos ? hashToArray(photos) : null;
    let photoCount = photosArray ? photosArray.length : null;

    return (
      <Card link={link} selected={isActive}>
        <StatusBar status={status}>
          <StatusText status={status}>
            {isNew && <span>New!</span>}

            {unreadMessages > 0 &&
              <span>
                {
                  `${unreadMessages} new ${unreadMessages === 1
                    ? 'message'
                    : 'messages'}`
                }
                {' '}·{' '}
                {timeDifference(Date.now(), timestamp)}
              </span>}

            {isActive &&
              messages > 0 &&
              <span>
                {`${messages} messages`}
                {' '}·{' '}
                {timeDifference(Date.now(), timestamp)}
              </span>}

            {isActive &&
              messages === 0 &&
              <span>Posted {timeDifference(Date.now(), timestamp)}</span>}

            {!isNew &&
              !unreadMessages &&
              !isActive &&
              messages > 0 &&
              <span>
                {`${messages} messages`}
                {' '}·{' '}
                {timeDifference(Date.now(), timestamp)}
              </span>}

            {!isNew &&
              !unreadMessages &&
              !isActive &&
              messages === 0 &&
              <span>Posted {timeDifference(Date.now(), timestamp)}</span>}
          </StatusText>
          <Dot status={status} />

          <Name status={status}>
            By {person.name} {metaText ? ' · ' : ''}
            {metaText &&
              metaLink &&
              <Link to={metaLink}>
                {metaText}
              </Link>}
          </Name>
        </StatusBar>

        <StoryBody>
          <Title>{title}</Title>

          {hasMetadata &&
            hasLinkPreview &&
            !hasPhotos &&
            <LinkPreviewContainer
              onClick={e => this.handleClick(e, metadata.linkPreview.trueUrl)}
            >
              <LinkPreview
                trueUrl={metadata.linkPreview.trueUrl}
                data={metadata.linkPreview.data}
                size={'small'}
                editable={false}
              />
            </LinkPreviewContainer>}

          {hasMetadata &&
            hasPhotos &&
            <PhotosContainer>
              {this.state.photos.map((photo, i) => {
                if (i < 3) {
                  return (
                    <PhotoContainer
                      key={photo.meta.key}
                      size={this.state.photos.length}
                    >
                      <Photo
                        src={photo.url}
                        onClick={e => this.openGallery(e, story.id)}
                      />
                    </PhotoContainer>
                  );
                }

                if (i === 3) {
                  return (
                    <PhotoContainer
                      key={photo.meta.key}
                      size={this.state.photos.length}
                    >
                      <PhotoPlaceholder count={this.state.photos.length - 3} />
                    </PhotoContainer>
                  );
                }
              })}
            </PhotosContainer>}
        </StoryBody>

        <HeadsContainer>
          {heads}
        </HeadsContainer>

      </Card>
    );
  }
}

const mapStateToProps = state => {
  return {
    user: state.user,
    frequencies: state.frequencies,
  };
};

export default connect(mapStateToProps)(StoryCard);