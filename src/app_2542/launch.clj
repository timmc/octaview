(ns app-2542.launch
  "AOT-prevention dynamic loader for `app-2542.main`."
  (:gen-class))

(defn -main
  "Chain to main.clj"
  [& args]
  (let [main-ns 'app-2542.main]
    (require main-ns)
    (apply (ns-resolve main-ns '-main) args)))
