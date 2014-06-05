using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using System.Windows.Forms;
using System.Threading;
using System.Runtime.Serialization.Formatters.Binary;

namespace JSonConfigEditor.util
{
    public class Utils
    {
        #region doIfType method (and overloads)
        /// <summary>
        /// Tries to cast obj to type T1, if the casting succeeds, call t1Action, passing
        /// it the casted object. If the casting fails, call defaultAction with the
        /// given, uncasted object.
        /// </summary>
        /// 
        /// <typeparam name="T1">The type to try to cast obj to</typeparam>
        /// <param name="obj">The object that needs to be casted</param>
        /// <param name="t1Action">The action to perform if the casting succeeded</param>
        /// <param name="defaultAction">The action to perform if the casting failed</param>
        public static Boolean doIfType<T1>(Object obj, Action<T1> t1Action,
            Action<Object> defaultAction)
        {
            if (obj is T1)
            {
                t1Action((T1)obj);
                return true;
            }
            else if (defaultAction != null)
            {
                defaultAction(obj);
                return true;
            }
            return false;
        }

        /// <summary>
        /// Tries to cast obj to type T1, if the casting succeeds, call t1Action, passing
        /// it the casted object. If the casting fails, tries to cast obj to type T2, if 
        /// the casting succeeds, call t2Action, passing it the casted object. If the 
        /// casting fails, call defaultAction with the given, uncasted object.
        /// </summary>
        /// <typeparam name="T1">The first type to try to cast obj to</typeparam>
        /// <typeparam name="T2">The second type to try to cast obj to</typeparam>
        /// <param name="obj">The object that needs to be casted.</param>
        /// <param name="t1Action">The action to perform if obj could be casted to 
        /// an object of type T1.</param>
        /// <param name="t2Action">The action to perform if obj could not be casted to 
        /// an object of type T1, but could be casted to an object of type T2.</param>
        /// <param name="defaultAction">The action to perform if obj could not be
        /// casted as an object of type T1 nor T2.</param>
        public static Boolean doIfType<T1, T2>(Object obj, Action<T1> t1Action,
            Action<T2> t2Action, Action<Object> defaultAction)
        {
            if (doIfType(obj, t1Action, null))
            {
                return true;
            }

            if (obj is T2)
            {
                t2Action((T2)obj);
                return true;
            }
            else if (defaultAction != null)
            {
                defaultAction(obj);
                return true;
            }
            return false;
        }

        public static Boolean doIfType<T1, T2, T3>(Object obj, Action<T1> t1Action,
            Action<T2> t2Action, Action<T3> t3action, Action<Object> defaultAction)
        {
            if (doIfType(obj, t1Action, t2Action, null))
            {
                return true;
            }

            if (obj is T3)
            {
                t3action((T3)obj);
                return true;
            }
            else if (defaultAction != null)
            {
                defaultAction(obj);
                return true;
            }
            return false;
        }
        #endregion

        #region assignIfType methods (and overloads)
        /// <summary>
        /// Tries to cast obj to type T1, if the casting succeeds, call t1Action, passing
        /// it the casted object. If the casting fails, call defaultAction with the
        /// given, uncasted object.
        /// </summary>
        /// 
        /// <typeparam name="T1">The type to try to cast obj to</typeparam>
        /// <param name="obj">The object that needs to be casted</param>
        /// <param name="t1Func">The action to perform if the casting succeeded</param>
        /// <param name="defaultFunc">The action to perform if the casting failed</param>
        public static R returnIfType<T1, R>(Object obj, Func<T1, R> t1Func,
            Func<Object, R> defaultFunc)
        {
            if (obj is T1)
            {
                return t1Func((T1)obj);
            }
            else if (defaultFunc != null)
            {
                return defaultFunc(obj);
            }
            return default(R);
        }

        /// <summary>
        /// Tries to cast obj to type T1, if the casting succeeds, call t1Action, passing
        /// it the casted object. If the casting fails, tries to cast obj to type T2, if 
        /// the casting succeeds, call t2Action, passing it the casted object. If the 
        /// casting fails, call defaultAction with the given, uncasted object.
        /// </summary>
        /// <typeparam name="T1">The first type to try to cast obj to</typeparam>
        /// <typeparam name="T2">The second type to try to cast obj to</typeparam>
        /// <param name="obj">The object that needs to be casted.</param>
        /// <param name="t1Action">The action to perform if obj could be casted to 
        /// an object of type T1.</param>
        /// <param name="t2Action">The action to perform if obj could not be casted to 
        /// an object of type T1, but could be casted to an object of type T2.</param>
        /// <param name="defaultAction">The action to perform if obj could not be
        /// casted as an object of type T1 nor T2.</param>
        public static R returnIfType<T1, T2, R>(Object obj, Func<T1, R> t1Func,
            Func<T2, R> t2Func, Func<Object, R> defaultFunc)
        {
            if (obj is T1)
            {
                return t1Func((T1)obj);
            }
            else if (obj is T2)
            {
                return t2Func((T2)obj);
            }
            else if (defaultFunc != null)
            {
                return defaultFunc(obj);
            }
            return default(R);
        }

        public static R returnIfType<T1, T2, T3, R>(Object obj, Func<T1, R> t1Func,
            Func<T2, R> t2Func, Func<T3, R> t3Func, Func<Object, R> defaultFunc)
        {
            if (obj is T1)
            {
                return t1Func((T1)obj);
            }
            else if (obj is T2)
            {
                return t2Func((T2)obj);
            }
            else if (obj is T3)
            {
                return t3Func((T3)obj);
            }
            else if (defaultFunc != null)
            {
                return defaultFunc(obj);
            }
            return default(R);
        }

        public static R returnIfType<T1, T2, T3, T4, R>(Object obj, Func<T1, R> t1Func,
            Func<T2, R> t2Func, Func<T3, R> t3Func, Func<T4, R> t4Func, Func<Object, R> defaultFunc)
        {
            if (obj is T1)
            {
                return t1Func((T1)obj);
            }
            else if (obj is T2)
            {
                return t2Func((T2)obj);
            }
            else if (obj is T3)
            {
                return t3Func((T3)obj);
            }
            else if (obj is T4)
            {
                return t4Func((T4)obj);
            }
            else if (defaultFunc != null)
            {
                return defaultFunc(obj);
            }
            return default(R);
        }
        #endregion

        #region Enumerable extensions for two lists
        /// <summary>
        /// A foreach loop that iterates over the two given IEnumerable (which should be
        /// of the same size) and calls the given action, passing it one element 
        /// from list1 and one element from list2. 
        /// </summary>
        /// 
        /// <example>
        /// The following code writes:
        /// a1
        /// b2
        /// c3
        /// To the console.
        /// <code>
        /// List&lt;string&gt list1 = new List()&lt;string&gt{a, b, c};
        /// List&lt;int&gt; list2 = new List&lt;int&gt(){1, 2, 3}; 
        /// Action action = (string a_string, int a_int) => {
        ///     Console.WriteLine(a_string + a_int);
        /// };
        /// forEach(list1, list2, action); 
        /// </code>
        /// </example>
        /// <typeparam name="T1">The type of elements in list1</typeparam>
        /// <typeparam name="T2">The type of elements in list2</typeparam>
        /// <param name="list1"></param>
        /// <param name="list2"></param>
        /// <param name="action">The action to perform on each element of the two given list.</param>
        public static void forEach<T1, T2>(IEnumerable<T1> list1, IEnumerable<T2> list2,
            Action<T1, T2> action)
        {
            var combined = list1.Zip(list2,
                (e1, e2) => new { element1 = e1, element2 = e2 });
            foreach (var e in combined)
            {
                action(e.element1, e.element2);
            }
        }

        /// <summary>
        /// A foreach loop that iterates over the two given IEnumerable (which should be
        /// of the same size) and calls the given Func, passing it one element from list1
        /// and one element from list2.
        /// </summary>
        /// <typeparam name="T1">The type of elements in list1</typeparam>
        /// <typeparam name="T2">The type of elements in list2</typeparam>
        /// <typeparam name="Result">The type of elements in the returned IEnumerable</typeparam>
        /// <param name="list1"></param>
        /// <param name="list2"></param>
        /// <param name="func">A function to be called on each element of the two given list</param>
        /// <returns></returns>
        public static IEnumerable<Result> map<T1, T2, Result>(
            IEnumerable<T1> list1, IEnumerable<T2> list2,
            Func<T1, T2, Result> func)
        {
            var combined = list1.Zip(list2,
                (e1, e2) => new { element1 = e1, element2 = e2 });
            List<Result> results = new List<Result>();
            foreach (var e in combined)
            {
                results.Add(func(e.element1, e.element2));
            }
            return results;
        }
        #endregion

        /// <summary>
        /// Returns the first element in the given T items that is 
        /// not null.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="objs"></param>
        /// <returns></returns>
        public static T returnIfNotNull<T>(params T[] objs)
        {
            foreach (T element in objs)
            {
                if (element != null)
                {
                    return element;
                }
            }
            return default(T);
        }

        /// <summary>
        /// Replaces the C# "is" operator for generic classes.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="t"></param>
        /// <returns></returns>
        public static bool IsTypeof<T>(object t)
        {
            return (t is T);
        }

        /// <summary>
        /// Run the given action on the STA thread. For example the Clipboard object
        /// can object be accessed in the STA thread.
        /// </summary>
        /// <param name="action"></param>
        public static void runOnSTA(Action action)
        {
            Thread staThread = new Thread(new ThreadStart(action));
            staThread.SetApartmentState(ApartmentState.STA);
            staThread.Start();
            staThread.Join();
        }

        public static bool IsSerializable(object obj)
        {
            System.IO.MemoryStream mem = new System.IO.MemoryStream();
            BinaryFormatter bin = new BinaryFormatter();
            try
            {
                bin.Serialize(mem, obj);
                return true;
            }
            catch (Exception ex)
            {
                MessageBox.Show("Your object cannot be serialized." +
                                 " The reason is: " + ex.ToString());
                return false;
            }
        }
    }

}
