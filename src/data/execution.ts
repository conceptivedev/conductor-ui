import { useMemo } from "react";
import WorkflowDAG from "../components/diagram/WorkflowDAG";
import { WorkflowDef } from "../types/workflowDef";
import { Execution, ExecutionAndTasks } from "../types/execution";
import { useFetch } from "./common";
import useAppContext from "../hooks/useAppContext";
import { useQueries, useQueryClient } from "react-query";

export function useWorkflow(workflowId: string) {
  return useFetch<Execution>(
    ["workflow", workflowId],
    `/v2/execution/${workflowId}`,
    {
      enabled: !!workflowId,
    }
  );
}

export function useWorkflowVariables(workflowId: string) {
  return useFetch(
    ["workflow", workflowId, "variables"],
    `/v2/execution/${workflowId}/variables`,
    {
      enabled: !!workflowId,
    }
  );
}

export function useWorkflowOutput(workflowId: string) {
  return useFetch(
    ["workflow", workflowId, "output"],
    `/v2/execution/${workflowId}/output`,
    {
      enabled: !!workflowId,
    }
  );
}

export function useWorkflowInput(workflowId: string) {
  return useFetch(
    ["workflow", workflowId, "input"],
    `/v2/execution/${workflowId}/input`,
    {
      enabled: !!workflowId,
    }
  );
}

export function useInvalidateExecution(workflowId: string) {
  const client = useQueryClient();
  const { stack } = useAppContext();

  return () => client.invalidateQueries([stack, "workflow", workflowId]);
}

// TODO: Should be done in backend for true interoperability.
export function useExecutionAndTasks(
  workflowId: string
): ExecutionAndTasks {
  const { fetchWithContext, ready, stack } = useAppContext();
  const results = useQueries([
    {
      queryKey: [stack, "workflow", workflowId],
      queryFn: () => fetchWithContext(`/v2/execution/${workflowId}`),
      enabled: ready
    },
    {
      queryKey: [stack, "workflow", workflowId, "tasks"],
      queryFn: () => fetchWithContext(`/v2/execution/${workflowId}/tasks`),
      enabled: ready
    },
  ]);

  const retval = useMemo(
    () =>
      results[0].data && results[1].data
        ? {
          execution: results[0].data,
          tasks: results[1].data,
          loading: results[0].isLoading || results[1].isLoading || results[0].isFetching || results[1].isFetching
        }
        : {
          execution: undefined,
          tasks: undefined,
          loading: results[0].isLoading || results[1].isLoading || results[0].isFetching || results[1].isFetching
        },
    [results]
  );

  return retval;
}

export function useWorkflowDag(executionAndTasks?: ExecutionAndTasks) {
  return useMemo(() => {
    return executionAndTasks?.execution && executionAndTasks?.tasks
      ? WorkflowDAG.fromExecutionAndTasks(executionAndTasks)
      : undefined;
  }, [executionAndTasks]);
}

export function useWorkflowDagFromDef(workflowDefinition?: WorkflowDef) {
  return useMemo(() => {
    return workflowDefinition
      ? WorkflowDAG.fromWorkflowDef(workflowDefinition)
      : undefined;
  }, [workflowDefinition]);
}

export function useWorkflowTask(
  workflowId?: string,
  taskReferenceName?: string,
  taskId?: string
) {
  let path = `/v2/execution/${workflowId}/task/${taskReferenceName}`;
  if (taskId) {
    path += `?taskId=${taskId}`;
  }
  return useFetch(["workflow", workflowId!, "task", taskReferenceName!], path, {
    enabled: !!workflowId && !!taskReferenceName,
  });
}

export function useWorkflowTaskOutput(
  workflowId?: string,
  taskReferenceName?: string,
  taskId?: string
) {
  let path = `/v2/execution/${workflowId}/task/${taskReferenceName}/output`;
  if (taskId) {
    path += `?taskId=${taskId}`;
  }
  return useFetch(
    ["workflow", workflowId!, "task", (taskId || taskReferenceName)!, "output"],
    path,
    {
      enabled: !!workflowId && !!taskReferenceName,
    }
  );
}

export function useWorkflowTaskInput(
  workflowId?: string,
  taskReferenceName?: string,
  taskId?: string
) {
  let path = `/v2/execution/${workflowId}/task/${taskReferenceName}/input`;
  if (taskId) {
    path += `?taskId=${taskId}`;
  }
  return useFetch(
    ["workflow", workflowId!, "task", (taskId || taskReferenceName)!, "input"],
    path,
    {
      enabled: !!workflowId && !!taskReferenceName,
    }
  );
}
