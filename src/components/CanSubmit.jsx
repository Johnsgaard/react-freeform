import PropTypes from 'prop-types';

import Subscriber from './Subscriber';

export default class CanSubmit extends Subscriber {
  static propTypes = {
    ...Subscriber.propTypes,
    children: PropTypes.func.isRequired,
  };

  static contextTypes = {
    ...Subscriber.contextTypes,
    nfIsLoading: PropTypes.func.isRequired,
    nfCanSubmit: PropTypes.func.isRequired,
  };

  constructor(props, context) {
    super(props, context);
    this.oldIsLoading = undefined;
    this.oldCanSubmit = undefined;
  }

  componentDidMount() {
    super.componentDidMount();
    this.oldIsLoading = this.context.nfIsLoading();
    this.oldCanSubmit = this.context.nfCanSubmit();
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    if (super.shouldComponentUpdate(nextProps, nextState, nextContext)) { return true; }
    let shouldUpdate = false;

    const newIsLoading = this.context.nfIsLoading();
    if (newIsLoading !== this.oldIsLoading) {
      this.oldIsLoading = newIsLoading;
      shouldUpdate = true;
    }

    const newCanSubmit = this.context.nfCanSubmit();
    if (newCanSubmit !== this.oldCanSubmit) {
      this.oldCanSubmit = newCanSubmit;
      shouldUpdate = true;
    }

    return shouldUpdate;
  }

  render() {
    return this.props.children({
      isLoading: this.context.nfIsLoading(),
      canSubmit: this.context.nfCanSubmit(),
    }) || null;
  }
}