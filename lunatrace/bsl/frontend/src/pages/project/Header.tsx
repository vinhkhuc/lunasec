/*
 * Copyright by LunaSec (owned by Refinery Labs, Inc)
 *
 * Licensed under the Business Source License v1.1
 * (the "License"); you may not use this file except in compliance with the
 * License. You may obtain a copy of the License at
 *
 * https://github.com/lunasec-io/lunasec/blob/master/licenses/BSL-LunaTrace.txt
 *
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import React from 'react';
import { Col, Row } from 'react-bootstrap';

import { ProjectInfo } from './types';

export interface ProjectHeaderProps {
  project: ProjectInfo;
}
export const ProjectHeader: React.FunctionComponent<ProjectHeaderProps> = ({ project }) => {
  return (
    <Row>
      <Col xs="12" style={{ textAlign: 'center' }}>
        <h1>{project.name}</h1>
      </Col>
    </Row>
  );
};
