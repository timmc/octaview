(ns octaview.launch
  "AOT-prevention dynamic loader for `octaview.main`."
  (:gen-class))

(defn -main
  "Chain to main.clj"
  [& args]
  (let [main-ns 'octaview.main]
    (require main-ns)
    (apply (ns-resolve main-ns '-main) args)))
