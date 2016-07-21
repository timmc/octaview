(ns octaview.config
  "Configuration access.

API:

- load!
- cnf
- settings-dir
- resolve-rel-settings"
  (:require [cheshire.core :as json]
            [clojure.java.io :as io]
            [clojure.tools.logging :as log])
  (:import (java.io File)
           (java.util Properties)))

;;;; Configuration

(defn validate
  [cnf]
  (when-not (number? (:port cnf))
    (throw (IllegalArgumentException. "Missing port setting")))
  (when-not (contains? cnf :dev)
    (throw (IllegalArgumentException. "Missing dev setting")))
  (when-not (string? (:descriptors-dir cnf))
    (throw (IllegalArgumentException. "Missing descriptors-dir setting")))
  true)

(defn from-file
  "Read a config map from file."
  [settings-path]
  (-> settings-path
      (slurp :encoding "UTF-8")
      (json/parse-string true)))

(defonce ^{:doc "Ref of config map: :port, ;dev, :descriptors-dir..."}
  config-data
  (ref nil))

(defonce ^{:doc "Ref of config metadata map: :settings-path"}
  config-meta
  (ref nil))

(defn load!
  "Read and use config map from file."
  [settings-path]
  (let [cnf (from-file settings-path)]
    (validate cnf)
    (dosync
     (ref-set config-data cnf)
     (ref-set config-meta {:settings-path settings-path}))))

(defn cnf
  "Read a config value."
  [k & ks]
  (get-in @config-data (cons k ks)))

(defn settings-dir
  "Yield the settings directory as a File."
  ^java.io.File
  []
  (.getParentFile (File. (:settings-path @config-meta))))

(defn resolve-rel-settings
  "Resolve a file path relative to the settings."
  ^java.io.File
  [^String rel-path]
  (File. (settings-dir) rel-path))

;;;; Introspection

(def project-properties-resource-path
  "Resource path for Maven pom properties"
  "META-INF/maven/org.timmc/octaview/pom.properties")

(defn read-own-version*
  "Unmemoized version of read-own-version."
  []
  (try
    (with-open [rdr (io/reader (io/resource project-properties-resource-path)
                               :encoding "UTF-8")]
      (.getProperty (doto (Properties.)
                      (.load rdr))
                    "version"
                    "unknown"))
    (catch Exception e
      (log/warn "Octaview could not discover own version:" e)
      "unknown")))

(def read-own-version
  "Read own version from project properties, or return \"unknown\"
on error. (Memoized.)"
  (memoize read-own-version*))
