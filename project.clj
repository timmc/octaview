(defproject org.timmc/octaview "1.0.0-SNAPSHOT"
  :dependencies [[org.clojure/clojure "1.8.0"]
                 [ring/ring-jetty-adapter "1.5.0"]
                 [compojure "1.5.1"]
                 [cheshire "5.6.3"]
                 [http-kit "2.1.19"]
                 ]
  :main octaview.launch
  :aot [octaview.launch]
  :repl-options {:init-ns octaview.main}
  :min-lein-version "2"
  :profiles {:uberjar {:aot :all}})
