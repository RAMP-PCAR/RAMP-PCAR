using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace JSonConfigEditor.module
{
    /// <summary>
    /// The Text of the label will be the default text concatenated with 
    /// the current state String. If the state is -1, then only the defaultText will show. 
    /// 
    /// <example>
    /// <code>
    /// StateLabel label = new StateLabel("someLabel", {"a", "b", "c"})
    /// label.setState(-1); // Will only show "someLabel"
    /// label.setState(0); // Will show "someLabela"
    /// label.setState(1); // Will show "someLabelb"
    /// label.setState(10); // Will throw an exception since index is out of bounds.
    /// </code>
    /// </example>
    /// 
    /// </summary>
    public class State<T>
    {
        private Dictionary<T, string> stateStrings;
        
        /**
         * Instantiates a label with the given default text, and an array of Strings
         * representing the state of this Label. 
         *  
         * See also the State property of this StateLabel.
         */
        public State(String baseText, T startState, Dictionary<T, string> stateStrings)
        {
            this.stateStrings = new Dictionary<T, string>(stateStrings);
            this._currentState = default(T);
            this.baseText = baseText;
        }

        #region Public Properties

        private string baseText;
        public string BaseText
        {
            get { return this.baseText; }
            set
            {
                this.baseText = value;
                updateText();
            }
        }

        private String text;
        public String Text
        {
            get { return this.text; }
        }

        private T _currentState;
        public T CurrentState
        {
            get { return this._currentState; }
            set
            {
                if (!stateStrings.ContainsKey(value))
                {
                    throw new ArgumentException("value must be in the stateStrings");
                }
                else if (!this._currentState.Equals(value))
                {
                    this._currentState = value;
                    updateText();
                }
            }
        }
        #endregion
        
        private void updateText()
        {
            this.text = baseText;
            if (_currentState != null)
            {
                this.text += stateStrings[_currentState];
            }
        }

        
    }
}
