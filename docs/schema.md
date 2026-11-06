

``` SQL
sqlite> .schema
CREATE TABLE agno_sessions (
        session_id VARCHAR NOT NULL, 
        session_type VARCHAR NOT NULL, 
        agent_id VARCHAR, 
        team_id VARCHAR, 
        workflow_id VARCHAR, 
        user_id VARCHAR, 
        session_data JSON, 
        agent_data JSON, 
        team_data JSON, 
        workflow_data JSON, 
        metadata JSON, 
        summary JSON, 
        created_at BIGINT NOT NULL, 
        updated_at BIGINT, 
        PRIMARY KEY (session_id)
);
CREATE INDEX idx_agno_sessions_session_type ON agno_sessions (session_type);
CREATE INDEX idx_agno_sessions_created_at ON agno_sessions (created_at);
CREATE TABLE agno_schema_versions (
        table_name VARCHAR NOT NULL, 
        version VARCHAR NOT NULL, 
        created_at VARCHAR NOT NULL, 
        updated_at VARCHAR, 
        PRIMARY KEY (table_name)
);
CREATE INDEX idx_agno_schema_versions_created_at ON agno_schema_versions (created_at);
CREATE TABLE agno_runs (
        run_id VARCHAR NOT NULL, 
        session_id VARCHAR NOT NULL, 
        run_type VARCHAR NOT NULL, 
        agent_id VARCHAR, 
        team_id VARCHAR, 
        workflow_id VARCHAR, 
        user_id VARCHAR, 
        parent_run_id VARCHAR, 
        status VARCHAR, 
        run_index BIGINT, 
        run_data JSON NOT NULL, 
        created_at BIGINT NOT NULL, 
        updated_at BIGINT, 
        PRIMARY KEY (run_id), 
        FOREIGN KEY(session_id) REFERENCES agno_sessions (session_id) ON DELETE CASCADE
);
CREATE INDEX idx_agno_runs_agent_id ON agno_runs (agent_id);
CREATE INDEX idx_agno_runs_user_id ON agno_runs (user_id);
CREATE INDEX idx_agno_runs_session_id_run_index ON agno_runs (session_id, run_index);
CREATE INDEX idx_agno_runs_run_type ON agno_runs (run_type);
CREATE INDEX idx_agno_runs_status ON agno_runs (status);
CREATE INDEX idx_agno_runs_team_id ON agno_runs (team_id);
CREATE INDEX idx_agno_runs_created_at ON agno_runs (created_at);
CREATE INDEX idx_agno_runs_workflow_id ON agno_runs (workflow_id);
CREATE INDEX idx_agno_runs_session_id ON agno_runs (session_id);
CREATE TABLE agno_memories (
        memory_id VARCHAR NOT NULL, 
        memory JSON NOT NULL, 
        input VARCHAR, 
        agent_id VARCHAR, 
        team_id VARCHAR, 
        user_id VARCHAR, 
        topics JSON, 
        feedback VARCHAR, 
        created_at BIGINT NOT NULL, 
        updated_at BIGINT, 
        PRIMARY KEY (memory_id)
);
CREATE INDEX idx_agno_memories_created_at ON agno_memories (created_at);
CREATE INDEX idx_agno_memories_updated_at ON agno_memories (updated_at);
CREATE INDEX idx_agno_memories_user_id ON agno_memories (user_id);
CREATE TABLE agno_metrics (
        id VARCHAR NOT NULL, 
        agent_runs_count BIGINT NOT NULL, 
        team_runs_count BIGINT NOT NULL, 
        workflow_runs_count BIGINT NOT NULL, 
        agent_sessions_count BIGINT NOT NULL, 
        team_sessions_count BIGINT NOT NULL, 
        workflow_sessions_count BIGINT NOT NULL, 
        users_count BIGINT NOT NULL, 
        token_metrics JSON NOT NULL, 
        model_metrics JSON NOT NULL, 
        date DATE NOT NULL, 
        aggregation_period VARCHAR NOT NULL, 
        user_id VARCHAR NOT NULL, 
        created_at BIGINT NOT NULL, 
        updated_at BIGINT, 
        completed BOOLEAN NOT NULL, 
        PRIMARY KEY (id), 
        CONSTRAINT agno_metrics_uq_metrics_user_date_period UNIQUE (user_id, date, aggregation_period)
);
CREATE INDEX idx_agno_metrics_aggregation_period ON agno_metrics (aggregation_period);
CREATE INDEX idx_agno_metrics_user_id ON agno_metrics (user_id);
CREATE INDEX idx_agno_metrics_date ON agno_metrics (date);
CREATE TABLE agno_eval_runs (
        run_id VARCHAR NOT NULL, 
        eval_type VARCHAR NOT NULL, 
        eval_data JSON NOT NULL, 
        eval_input JSON NOT NULL, 
        name VARCHAR, 
        agent_id VARCHAR, 
        team_id VARCHAR, 
        workflow_id VARCHAR, 
        model_id VARCHAR, 
        model_provider VARCHAR, 
        evaluated_component_name VARCHAR, 
        user_id VARCHAR, 
        created_at BIGINT NOT NULL, 
        updated_at BIGINT, 
        PRIMARY KEY (run_id)
);
CREATE INDEX idx_agno_eval_runs_created_at ON agno_eval_runs (created_at);
CREATE INDEX idx_agno_eval_runs_user_id ON agno_eval_runs (user_id);
CREATE TABLE agno_knowledge (
        id VARCHAR NOT NULL, 
        name VARCHAR NOT NULL, 
        description VARCHAR NOT NULL, 
        metadata JSON, 
        type VARCHAR, 
        size BIGINT, 
        linked_to VARCHAR, 
        access_count BIGINT, 
        status VARCHAR, 
        status_message VARCHAR, 
        created_at BIGINT, 
        updated_at BIGINT, 
        external_id VARCHAR, 
        user_id VARCHAR, 
        PRIMARY KEY (id)
);
CREATE INDEX idx_agno_knowledge_user_id ON agno_knowledge (user_id);
CREATE INDEX idx_agno_knowledge_user_id_linked_to ON agno_knowledge (user_id, linked_to);
CREATE TABLE agno_components (
        component_id VARCHAR NOT NULL, 
        component_type VARCHAR NOT NULL, 
        name VARCHAR NOT NULL, 
        user_id VARCHAR, 
        description VARCHAR, 
        current_version BIGINT, 
        metadata JSON, 
        created_at BIGINT NOT NULL, 
        updated_at BIGINT, 
        deleted_at BIGINT, 
        PRIMARY KEY (component_id)
);
CREATE INDEX idx_agno_components_component_type ON agno_components (component_type);
CREATE INDEX idx_agno_components_created_at ON agno_components (created_at);
CREATE INDEX idx_agno_components_current_version ON agno_components (current_version);
CREATE INDEX idx_agno_components_name ON agno_components (name);
CREATE INDEX idx_agno_components_user_id ON agno_components (user_id);
CREATE TABLE agno_component_configs (
        component_id VARCHAR NOT NULL, 
        version BIGINT NOT NULL, 
        label VARCHAR, 
        stage VARCHAR NOT NULL, 
        config JSON NOT NULL, 
        notes VARCHAR, 
        created_at BIGINT NOT NULL, 
        updated_at BIGINT, 
        PRIMARY KEY (component_id, version)
);
CREATE INDEX idx_agno_component_configs_stage ON agno_component_configs (stage);
CREATE INDEX idx_agno_component_configs_created_at ON agno_component_configs (created_at);
CREATE TABLE agno_component_links (
        parent_component_id VARCHAR NOT NULL, 
        parent_version BIGINT NOT NULL, 
        link_kind VARCHAR NOT NULL, 
        link_key VARCHAR NOT NULL, 
        child_component_id VARCHAR NOT NULL, 
        child_version BIGINT, 
        position BIGINT NOT NULL, 
        meta JSON, 
        created_at BIGINT, 
        updated_at BIGINT, 
        PRIMARY KEY (parent_component_id, parent_version, link_kind, link_key)
);
CREATE INDEX idx_agno_component_links_created_at ON agno_component_links (created_at);
CREATE INDEX idx_agno_component_links_link_kind ON agno_component_links (link_kind);
CREATE TABLE agno_learnings (
        learning_id VARCHAR NOT NULL, 
        learning_type VARCHAR NOT NULL, 
        namespace VARCHAR, 
        user_id VARCHAR, 
        agent_id VARCHAR, 
        team_id VARCHAR, 
        workflow_id VARCHAR, 
        session_id VARCHAR, 
        entity_id VARCHAR, 
        entity_type VARCHAR, 
        content JSON NOT NULL, 
        metadata JSON, 
        created_at BIGINT NOT NULL, 
        updated_at BIGINT, 
        PRIMARY KEY (learning_id)
);
CREATE INDEX idx_agno_learnings_entity_id ON agno_learnings (entity_id);
CREATE INDEX idx_agno_learnings_team_id ON agno_learnings (team_id);
CREATE INDEX idx_agno_learnings_agent_id ON agno_learnings (agent_id);
CREATE INDEX idx_agno_learnings_user_id ON agno_learnings (user_id);
CREATE INDEX idx_agno_learnings_created_at ON agno_learnings (created_at);
CREATE INDEX idx_agno_learnings_session_id ON agno_learnings (session_id);
CREATE INDEX idx_agno_learnings_namespace ON agno_learnings (namespace);
CREATE INDEX idx_agno_learnings_entity_type ON agno_learnings (entity_type);
CREATE INDEX idx_agno_learnings_workflow_id ON agno_learnings (workflow_id);
CREATE INDEX idx_agno_learnings_learning_type ON agno_learnings (learning_type);
CREATE TABLE agno_schedules (
        id VARCHAR NOT NULL, 
        name VARCHAR NOT NULL, 
        description VARCHAR, 
        method VARCHAR NOT NULL, 
        endpoint VARCHAR NOT NULL, 
        payload JSON, 
        cron_expr VARCHAR NOT NULL, 
        timezone VARCHAR NOT NULL, 
        timeout_seconds BIGINT NOT NULL, 
        max_retries BIGINT NOT NULL, 
        retry_delay_seconds BIGINT NOT NULL, 
        enabled BOOLEAN NOT NULL, 
        next_run_at BIGINT, 
        locked_by VARCHAR, 
        locked_at BIGINT, 
        user_id VARCHAR, 
        managed_by VARCHAR, 
        target_type VARCHAR, 
        target_id VARCHAR, 
        created_by_run_id VARCHAR, 
        created_by_session_id VARCHAR, 
        updated_by_run_id VARCHAR, 
        updated_by_session_id VARCHAR, 
        disabled_reason VARCHAR, 
        created_at BIGINT NOT NULL, 
        updated_at BIGINT, 
        PRIMARY KEY (id)
);
CREATE UNIQUE INDEX agno_schedules_uq_unowned_name ON agno_schedules (name) WHERE user_id IS NULL;
CREATE INDEX idx_agno_schedules_user_id_enabled_next_run_at ON agno_schedules (user_id, enabled, next_run_at);
CREATE INDEX idx_agno_schedules_enabled_next_run_at ON agno_schedules (enabled, next_run_at);
CREATE INDEX idx_agno_schedules_managed_by ON agno_schedules (managed_by);
CREATE INDEX idx_agno_schedules_next_run_at ON agno_schedules (next_run_at);
CREATE INDEX idx_agno_schedules_name ON agno_schedules (name);
CREATE INDEX idx_agno_schedules_created_at ON agno_schedules (created_at);
CREATE INDEX idx_agno_schedules_user_id ON agno_schedules (user_id);
CREATE UNIQUE INDEX agno_schedules_uq_user_name ON agno_schedules (user_id, name) WHERE user_id IS NOT NULL;
CREATE INDEX idx_agno_schedules_target_id ON agno_schedules (target_id);
CREATE TABLE agno_schedule_runs (
        id VARCHAR NOT NULL, 
        schedule_id VARCHAR NOT NULL, 
        attempt BIGINT NOT NULL, 
        triggered_at BIGINT, 
        completed_at BIGINT, 
        status VARCHAR NOT NULL, 
        status_code BIGINT, 
        run_id VARCHAR, 
        session_id VARCHAR, 
        error VARCHAR, 
        input JSON, 
        output JSON, 
        requirements JSON, 
        user_id VARCHAR, 
        created_at BIGINT NOT NULL, 
        PRIMARY KEY (id), 
        FOREIGN KEY(schedule_id) REFERENCES agno_schedules (id) ON DELETE CASCADE
);
CREATE INDEX idx_agno_schedule_runs_created_at ON agno_schedule_runs (created_at);
CREATE INDEX idx_agno_schedule_runs_status ON agno_schedule_runs (status);
CREATE INDEX idx_agno_schedule_runs_user_id ON agno_schedule_runs (user_id);
CREATE INDEX idx_agno_schedule_runs_schedule_id ON agno_schedule_runs (schedule_id);
CREATE TABLE agno_approvals (
        id VARCHAR NOT NULL, 
        run_id VARCHAR NOT NULL, 
        session_id VARCHAR NOT NULL, 
        status VARCHAR NOT NULL, 
        source_type VARCHAR NOT NULL, 
        approval_type VARCHAR, 
        pause_type VARCHAR NOT NULL, 
        tool_name VARCHAR, 
        tool_args JSON, 
        expires_at BIGINT, 
        agent_id VARCHAR, 
        team_id VARCHAR, 
        workflow_id VARCHAR, 
        user_id VARCHAR, 
        schedule_id VARCHAR, 
        schedule_run_id VARCHAR, 
        source_name VARCHAR, 
        requirements JSON, 
        context JSON, 
        resolution_data JSON, 
        resolved_by VARCHAR, 
        resolved_at BIGINT, 
        created_at BIGINT NOT NULL, 
        updated_at BIGINT, 
        run_status VARCHAR, 
        PRIMARY KEY (id)
);
CREATE INDEX idx_agno_approvals_agent_id ON agno_approvals (agent_id);
CREATE INDEX idx_agno_approvals_run_id ON agno_approvals (run_id);
CREATE INDEX idx_agno_approvals_schedule_run_id ON agno_approvals (schedule_run_id);
CREATE INDEX idx_agno_approvals_workflow_id ON agno_approvals (workflow_id);
CREATE INDEX idx_agno_approvals_pause_type ON agno_approvals (pause_type);
CREATE INDEX idx_agno_approvals_run_status ON agno_approvals (run_status);
CREATE INDEX idx_agno_approvals_source_type ON agno_approvals (source_type);
CREATE INDEX idx_agno_approvals_status ON agno_approvals (status);
CREATE INDEX idx_agno_approvals_schedule_id ON agno_approvals (schedule_id);
CREATE INDEX idx_agno_approvals_team_id ON agno_approvals (team_id);
CREATE INDEX idx_agno_approvals_created_at ON agno_approvals (created_at);
CREATE INDEX idx_agno_approvals_approval_type ON agno_approvals (approval_type);
CREATE INDEX idx_agno_approvals_session_id ON agno_approvals (session_id);
CREATE INDEX idx_agno_approvals_user_id ON agno_approvals (user_id);
CREATE TABLE agno_service_accounts (
        id VARCHAR NOT NULL, 
        name VARCHAR NOT NULL, 
        user_id VARCHAR, 
        token_hash VARCHAR NOT NULL, 
        token_prefix VARCHAR NOT NULL, 
        scopes JSON NOT NULL, 
        created_at BIGINT NOT NULL, 
        expires_at BIGINT, 
        last_used_at BIGINT, 
        revoked_at BIGINT, 
        created_by VARCHAR, 
        PRIMARY KEY (id), 
        UNIQUE (token_hash)
);
CREATE INDEX idx_agno_service_accounts_created_at ON agno_service_accounts (created_at);
CREATE UNIQUE INDEX agno_service_accounts_uq_active_name ON agno_service_accounts (name) WHERE revoked_at IS NULL;
CREATE INDEX idx_agno_service_accounts_token_hash ON agno_service_accounts (token_hash);
CREATE TABLE agno_tool_results (
        result_id VARCHAR NOT NULL, 
        namespace VARCHAR NOT NULL, 
        path VARCHAR NOT NULL, 
        session_id VARCHAR NOT NULL, 
        run_id VARCHAR NOT NULL, 
        tool_call_id VARCHAR NOT NULL, 
        tool_name VARCHAR NOT NULL, 
        args_hash VARCHAR NOT NULL, 
        content_type VARCHAR NOT NULL, 
        size_bytes BIGINT NOT NULL, 
        line_count BIGINT NOT NULL, 
        preview VARCHAR NOT NULL, 
        user_id VARCHAR, 
        created_at BIGINT NOT NULL, 
        expires_at BIGINT, 
        PRIMARY KEY (result_id), 
        CONSTRAINT agno_tool_results_uq_tool_results_namespace_path UNIQUE (namespace, path)
);
CREATE INDEX idx_agno_tool_results_expires_at ON agno_tool_results (expires_at);
CREATE INDEX idx_agno_tool_results_session_id_created_at ON agno_tool_results (session_id, created_at);
sqlite> 
```