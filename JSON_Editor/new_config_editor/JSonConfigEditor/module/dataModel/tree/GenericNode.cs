using System;
using System.Collections.Generic;
using System.Text;
using System.Collections.ObjectModel;
using System.Windows.Forms;
using System.Drawing;
using Aga.Controls.Tree;
using JSonConfigEditor.dataModel;
using JSonConfigEditor.dataModel.configElement;
using JSonConfigEditor.util;

namespace JSonConfigEditor.tree
{
    [Serializable]
	public class GenericNode<T> : IDeepCloneable<GenericNode<T>> where T : INodeData<T>
	{
        [Serializable]
		private class NodeCollection : Collection<GenericNode<T>>
		{
			private GenericNode<T> _owner;

			public NodeCollection(GenericNode<T> owner)
			{
				_owner = owner;
			}

			protected override void ClearItems()
			{
				while (this.Count != 0)
					this.RemoveAt(this.Count - 1);
			}

			protected override void InsertItem(int index, GenericNode<T> item)
			{
				if (item == null)
					throw new ArgumentNullException("item");

				if (item.Parent != _owner)
				{
					if (item.Parent != null)
						item.Parent.Children.Remove(item);
					item._parent = _owner;
                    item.Data.Owner = item;
					item._index = index;
					for (int i = index; i < Count; i++)
						this[i]._index++;
					base.InsertItem(index, item);

					GenericTreeModel<T> model = _owner.FindModel();
					if (model != null)
						model.OnNodeInserted(_owner, index, item);
				}
			}

			protected override void RemoveItem(int index)
			{
				GenericNode<T> item = this[index];
				item._parent = null;
                item.Data.Owner = null;
				item._index = -1;
				for (int i = index + 1; i < Count; i++)
					this[i]._index--;
				base.RemoveItem(index);

				GenericTreeModel<T> model = _owner.FindModel();
				if (model != null)
					model.OnNodeRemoved(_owner, index, item);
			}

			protected override void SetItem(int index, GenericNode<T> item)
			{
				if (item == null)
					throw new ArgumentNullException("item");

				RemoveAt(index);
				InsertItem(index, item);
			}
		}
        
		#region Properties

        internal GenericTreeModel<T> Model
        {
            get;
            set;
        }

        private readonly Collection<GenericNode<T>> _children;
        public Collection<GenericNode<T>> Children
        {
            get {return _children; }
        }

		private GenericNode<T> _parent;
		public GenericNode<T> Parent
		{
			get { return _parent; }
			set 
			{
				if (value != _parent)
				{
					if (_parent != null)
						_parent.Children.Remove(this);

					if (value != null)
						value.Children.Add(this);
				}
			}
		}

		private int _index = -1;
		public int Index
		{
			get
			{
				return _index;
			}
		}

        /// <summary>
        /// Returns the previous sibling of this node (null if none exists).
        /// </summary>
		public GenericNode<T> PreviousNode
		{
			get
			{
				int index = Index;
				if (index > 0)
					return _parent.Children[index - 1];
				else
					return null;
			}
		}

        /// <summary>
        /// Returns the next sibling of this node (null if none exists).
        /// </summary>
		public GenericNode<T> NextNode
		{
			get
			{
				int index = Index;
				if (index >= 0 && index < _parent.Children.Count - 1)
					return _parent.Children[index + 1];
				else
					return null;
			}
		}

		private string _text;
		public virtual string Text
		{
			get { return _text; }
			set 
			{
				if (_text != value)
				{
					_text = value;
					NotifyModel();
				}
			}
		}

		private CheckState _checkState;
		public virtual CheckState CheckState
		{
			get { return _checkState; }
			set 
			{
				if (_checkState != value)
				{
					_checkState = value;
					NotifyModel();
				}
			}
		}

		private Image _image;
		public Image Image
		{
			get { return _image; }
			set 
			{
				if (_image != value)
				{
					_image = value;
					NotifyModel();
				}
			}
		}

        private T _data;
        public T Data
        {
            get {return _data;}
            set {
                value.Owner = this;
                _data = value; 
            }
        }

		public bool IsChecked
		{
			get 
			{ 
				return CheckState != CheckState.Unchecked;
			}
			set 
			{
				if (value)
					CheckState = CheckState.Checked;
				else
					CheckState = CheckState.Unchecked;
			}
		}

        /// <summary>
        /// Returns true if this node is a leaf node (i.e. has no children).
        /// </summary>
		public virtual bool IsLeaf
		{
			get
			{
                return Children.Count == 0;
			}
		}

		#endregion

		public GenericNode()
			: this(string.Empty)
		{
		}

		public GenericNode(string text)
		{
			_text = text;
			_children = new NodeCollection(this);
		}

		public override string ToString()
		{
			return Text;
		}

		private GenericTreeModel<T> FindModel()
		{
			GenericNode<T> node = this;
			while (node != null)
			{
				if (node.Model != null)
					return node.Model;
				node = node.Parent;
			}
			return null;
		}

		protected void NotifyModel()
		{
			GenericTreeModel<T> model = FindModel();
			if (model != null && Parent != null)
			{
				TreePath path = model.GetPath(Parent);
				if (path != null)
				{
					TreeModelEventArgs args = new TreeModelEventArgs(path, new int[] { Index }, new object[] { this });
					model.OnNodesChanged(args);
				}
			}
		}

        public GenericNode<T> deepClone()
        {
            GenericNode<T> clone = new GenericNode<T>(this.Text);

            // Clone any fields
            clone.Data = this.Data.deepClone();

            // Recursively clone the children
            foreach (GenericNode<T> child in this.Children) {
                clone.Children.Add(child.deepClone());
            }

            return clone;
        }
    }
}
