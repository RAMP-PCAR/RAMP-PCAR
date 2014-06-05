using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Data;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using JSonConfigEditor.module;

namespace JSonConfigEditor.gui.label
{
    /**
     * A label which has one of several states, the text of the label
     * changes depending on what state it is in.
     */
    public partial class StateLabel<T> : Label
    {
        private State<T> state;

        public StateLabel(T defaultState, Dictionary<T, string> states)
        {
            this.state = new State<T>("", defaultState, states);
            //this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
        }

        public State<T> State
        {
            get { return this.state; }
        }
        
        public override string Text
        {
            get
            {
                return base.Text;
            }
            /**
             * Sets default text 
             */
            set
            {
                this.state.BaseText = value;
                base.Text = this.State.Text;
            }
        }
    }
}
