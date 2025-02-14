/*
 * Copyright (C) 2021 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react'
import {render} from '@testing-library/react'
import {AttachmentDisplay} from '../AttachmentDisplay'

const setup = props => {
  return render(
    <AttachmentDisplay
      setAttachments={() => {}}
      setAttachmentsToUpload={() => {}}
      attachments={[]}
      {...props}
    />
  )
}

describe('AttachmentDisplay', () => {
  it('displays AttachButton when there are no attachments', () => {
    const {queryByText} = setup()
    expect(queryByText('Attach')).toBeTruthy()
  })

  it('only allows one attachment at a time', () => {
    const {queryByTestId} = setup()
    expect(queryByTestId('attachment-input')).toHaveAttribute('type', 'file')
    expect(queryByTestId('attachment-input')).not.toHaveAttribute('multiple')
  })

  it('displays AttachmentButton when there are no attachments', () => {
    const {queryByText} = setup({
      attachments: [
        {
          id: 1,
          display_name: 'file_name.file',
          url: 'file_download_example.com'
        }
      ]
    })

    expect(queryByText('Attach')).toBeFalsy()
    expect(queryByText('file_name.file')).toBeTruthy()
  })
})
