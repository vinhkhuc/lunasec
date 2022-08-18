COMMENT ON COLUMN build_dependency_relationship.id IS 'merkle tree hash of dependency relationship and its transitive dependencies. not a random UUID.';

ALTER TABLE build_dependency_relationship
    ALTER COLUMN id DROP DEFAULT;

CREATE TABLE build_dependency
(
    build_id                         uuid
        REFERENCES builds (id),
    release_id                       uuid
        REFERENCES package.release (id),
    build_dependency_relationship_id uuid,
    range                            TEXT NOT NULL,
    labels                           jsonb,
    project_path                     TEXT NOT NULL
);

COMMENT ON TABLE build_dependency IS 'direct dependencies of builds with pointers to their location in the merkel tree table';

COMMENT ON COLUMN build_dependency.build_dependency_relationship_id IS 'pointer to merkel tree of transitive dependencies';

CREATE INDEX ON build_dependency (build_id);
