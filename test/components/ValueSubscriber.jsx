import React from 'react';
import { expect } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';

import ValueSubscriber from 'react-freeform/components/ValueSubscriber';

// Tests for components that this extends or uses
import './Subscriber';

const values = {
  a: true,
  b: null,
  c: ['1', '2'],
  d: {
    d1: 'nested',
  },
};

const noop = () => {};
const context = {
  ffOnChange: noop,
  ffGetValue: () => values,
  ffFullName: () => ([]),
  formSubscription: { subscribe: noop, unsubscribe: noop },
};

describe('components/ValueSubscriber', () => {
  it('provides access to the form values without a name', () => {
    const wrapper = shallow(<ValueSubscriber />, { context });
    const component = wrapper.instance();
    expect(component.getChildContext().ffGetValue()).to.equal(values);
  });

  it('uses the name for nesting values and onChange events', () => {
    const testChange = (name, value, onChangeArg, event) => {
      const ffOnChange = sinon.spy();
      const wrapper = shallow(<ValueSubscriber name={name} />, { context: { ...context, ffOnChange } });
      const component = wrapper.instance();
      const childContext = component.getChildContext();
      expect(childContext.ffGetValue()).to.equal(value);

      component.onChange(onChangeArg);
      expect(ffOnChange.calledOnce).to.equal(true);
      expect(ffOnChange.args[0][0].target).to.deep.equal(event);
    };

    testChange('a', values.a, { target: { name: '', value: false } }, { name: ['a'], value: false });
    testChange('a', values.a, false, { name: ['a'], value: false });
    testChange('b', values.b, { test: true }, { name: ['b'], value: { test: true } });
    testChange('c', values.c, ['3', '4'], { name: ['c'], value: ['3', '4'] });
    testChange('c', values.c, { target: { name: '0', value: '5' } }, { name: ['c', '0'], value: '5' });
    testChange('d', values.d, { d1: 'replaced' }, { name: ['d'], value: { d1: 'replaced' } });
    testChange('d', values.d, { target: { name: 'd1', value: 'replaced' } }, { name: ['d', 'd1'], value: 'replaced' });
  });

  it('handles numbers for accessing array values', () => {
    const ffOnChange = sinon.spy();
    const wrapper = shallow(<ValueSubscriber name="0" />, {
      context: { ...context, ffOnChange, ffGetValue: () => values.c },
    });
    const component = wrapper.instance();
    expect(component.getValue()).to.equal(values.c[0]);

    component.onChange('replaced');
    expect(ffOnChange.calledOnce).to.equal(true);
    expect(ffOnChange.args[0][0].target).to.deep.equal({ name: ['0'], value: 'replaced' });
  });

  it('only rerenders when the value changes, or props/state change', () => {
    let testValue = values;
    const wrapper = mount(<ValueSubscriber />, {
      context: { ...context, ffGetValue: () => testValue },
    });
    const shouldUpdateSpy = sinon.spy(wrapper.instance(), 'shouldComponentUpdate');

    expect(shouldUpdateSpy.called).to.equal(false);

    wrapper.setProps({});
    expect(shouldUpdateSpy.returnValues[0]).to.equal(false);

    wrapper.setState({});
    expect(shouldUpdateSpy.returnValues[1]).to.equal(false);

    wrapper.setProps({ 'data-test': true });
    expect(shouldUpdateSpy.returnValues[2]).to.equal(true);

    wrapper.setState({ test: true });
    expect(shouldUpdateSpy.returnValues[3]).to.equal(true);

    testValue = { ...testValue, a: false };
    wrapper.setState({});
    expect(shouldUpdateSpy.returnValues[4]).to.equal(true);

    shouldUpdateSpy.restore();
  });

  it('should throw an invariant when fetching a missing value', () => {
    expect(() => shallow(<ValueSubscriber name="thisKeyIsMissing" />, { context }))
      .to.throw('"thisKeyIsMissing" must have a value. Please check the handler\'s getDefaults() method.');
  });

  it('nests context.ffFullName()', () => {
    const getFullName = (name, childName, val = values) => shallow(
      <ValueSubscriber name={childName} />,
      { context: { ...context, ffFullName: () => [].concat(name), ffGetValue: () => val } },
    ).instance().getChildContext().ffFullName();

    expect(getFullName('d')).to.deep.equal(['d']);
    expect(getFullName('d', 'd1', { d1: true })).to.deep.equal(['d', 'd1']);
    expect(getFullName('c', '0', [false, true])).to.deep.equal(['c', '0']);
  });

  it('enforces onChange not altering value types', () => {
    const changeType = (oldVal, newVal, name) =>
      shallow(<ValueSubscriber />, { context: { ...context, ffGetValue: () => oldVal } })
        .instance()
        .onChange({ target: { name, value: newVal } });

    // Same type
    expect(() => changeType(true, false)).to.not.throw();
    expect(() => changeType(0, 1)).to.not.throw();
    expect(() => changeType('a', 'b')).to.not.throw();
    expect(() => changeType([], [])).to.not.throw();
    expect(() => changeType({}, {})).to.not.throw();

    // Same type with new type inside
    expect(() => changeType([], ['test'])).to.not.throw();
    expect(() => changeType({}, { test: 'test' })).to.not.throw();
    // Same type with no type inside
    expect(() => changeType(['test'], [])).to.not.throw();
    expect(() => changeType({ test: 'test' }, {})).to.not.throw();

    expect(() => changeType(true, 'string')).to.throw();
    expect(() => changeType('0', 0)).to.throw();
    expect(() => changeType([], {})).to.throw();
    expect(() => changeType([], true)).to.throw();
    expect(() => changeType({}, [])).to.throw();
    expect(() => changeType({}, true)).to.throw();

    // Same type with different type inside
    expect(() => changeType(['a'], [true])).to.throw();
    expect(() => changeType({ test: 'a' }, { test: true })).to.throw();

    // Allow replacing values with null
    expect(() => changeType([], null)).to.not.throw();
    expect(() => changeType(['test'], [null])).to.not.throw();
    expect(() => changeType({}, null)).to.not.throw();
    expect(() => changeType({ test: 'test' }, { test: null })).to.not.throw();

    // Test name paths
    expect(() => changeType({ test: [] }, 'replace array', 'test')).to.throw();
    expect(() => changeType({ test: [] }, 'replace array', ['test'])).to.throw();
    expect(() => changeType({ test: [{}] }, 'replace array', ['test', 0])).to.throw();

    // Allow strings to change to numbers, if the original was a number
    expect(() => changeType(5, '4')).to.not.throw();
    expect(() => changeType(5, 'a')).to.throw();
  });
});
