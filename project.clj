(defproject app-2542 "0.1.0-SNAPSHOT"
  :dependencies [[org.clojure/clojure "1.8.0"]
                 [ring/ring-jetty-adapter "1.5.0"]
                 [compojure "1.5.1"]
                 [cheshire "5.6.3"]]
  :plugins [[lein-npm "0.6.2"]]
  :main app-2542.launch
  :aot [app-2542.launch]
  :repl-options {:init-ns app-2542.main}
  :npm {:dependencies [[cytoscape-dagre "1.3.0"]
                       [jquery "3.0.0"]
                       [browserify "13.0.1"]]}
  :min-lein-version "2"
  :profiles {:uberjar {:aot :all}})
