using System;
using System.Collections.Generic;
using System.Text;
using System.Collections.ObjectModel;
using Aga.Controls.Tree;

namespace JSonConfigEditor.tree
{
	/// <summary>
	/// Provides a simple ready to use implementation of <see cref="ITreeModel"/>. Warning: this class is not optimized 
	/// to work with big amount of data. In this case create you own implementation of <c>ITreeModel</c>, and pay attention
	/// on GetChildren and IsLeaf methods.
	/// </summary>
    [Serializable]
	public class GenericTreeModel<T> : ITreeModel where T : INodeData<T>
	{
		public GenericNode<T> Root
		{
			get;
	        private set;
        }

		public Collection<GenericNode<T>> Children
		{
			get { return Root.Children; }
		}

		public GenericTreeModel()
		{
			Root = new GenericNode<T>();
			Root.Model = this;
		}

		public TreePath GetPath(GenericNode<T> node)
		{
            if (node == Root)
            {
                return TreePath.Empty;
            }
            else
            {
                Stack<object> stack = new Stack<object>();
                while (node != Root)
                {
                    stack.Push(node);
                    node = node.Parent;
                }
                return new TreePath(stack.ToArray());
            }
		}

		public GenericNode<T> FindNode(TreePath path)
		{
			if (path.IsEmpty())
				return Root;
			else
				return FindNode(Root, path, 0);
		}

		private GenericNode<T> FindNode(GenericNode<T> root, TreePath path, int level)
		{
			foreach (GenericNode<T> node in root.Children)
				if (node == path.FullPath[level])
				{
					if (level == path.FullPath.Length - 1)
						return node;
					else
						return FindNode(node, path, level + 1);
				}
			return null;
		}

		#region ITreeModel Members

		public System.Collections.IEnumerable GetChildren(TreePath treePath)
		{
			GenericNode<T> node = FindNode(treePath);
			if (node != null)
				foreach (GenericNode<T> n in node.Children)
					yield return n;
			else
				yield break;
		}

		public bool IsLeaf(TreePath treePath)
		{
			GenericNode<T> node = FindNode(treePath);
			if (node != null)
				return node.IsLeaf;
			else
				throw new ArgumentException("treePath");
		}

		public event EventHandler<TreeModelEventArgs> NodesChanged;
		internal void OnNodesChanged(TreeModelEventArgs args)
		{
			if (NodesChanged != null)
				NodesChanged(this, args);
		}

		public event EventHandler<TreePathEventArgs> StructureChanged;
		public void OnStructureChanged(TreePathEventArgs args)
		{
			if (StructureChanged != null)
				StructureChanged(this, args);
		}

		public event EventHandler<TreeModelEventArgs> NodesInserted;
		internal void OnNodeInserted(GenericNode<T> parent, int index, GenericNode<T> node)
		{
			if (NodesInserted != null)
			{
				TreeModelEventArgs args = new TreeModelEventArgs(GetPath(parent), new int[] { index }, new object[] { node });
				NodesInserted(this, args);
			}

		}

		public event EventHandler<TreeModelEventArgs> NodesRemoved;
		internal void OnNodeRemoved(GenericNode<T> parent, int index, GenericNode<T> node)
		{
			if (NodesRemoved != null)
			{
				TreeModelEventArgs args = new TreeModelEventArgs(GetPath(parent), new int[] { index }, new object[] { node });
				NodesRemoved(this, args);
			}
		}

		#endregion
	}
}
