(defproject app-2542 "0.1.0-SNAPSHOT"
  :dependencies [[org.clojure/clojure "1.8.0"]
                 [ring/ring-jetty-adapter "1.5.0"]
                 [compojure "1.5.1"]
                 [cheshire "5.6.3"]]
  :main app-2542.launch
  :aot [app-2542.launch]
  :repl-options {:init-ns app-2542.main}
  :min-lein-version "2"
  :profiles {:uberjar {:aot :all}})
