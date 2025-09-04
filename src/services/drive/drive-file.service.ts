import { StorageTypes } from '@internxt/sdk/dist/drive';
import { SdkManager } from '../sdk-manager.service';
import { DriveFileItem } from '../../types/drive.types';
import { DriveUtils } from '../../utils/drive.utils';

export class DriveFileService {
  static readonly instance = new DriveFileService();

  public createFile = async (payload: StorageTypes.FileEntryByUuid): Promise<DriveFileItem> => {
    const storageClient = SdkManager.instance.getStorage(true);
    const driveFile = await storageClient.createFileEntryByUuid(payload);

    return {
      name: payload.plain_name,
      encryptedName: driveFile.name,
      id: driveFile.id,
      uuid: driveFile.uuid,
      size: driveFile.size,
      bucket: driveFile.bucket,
      createdAt: new Date(driveFile.createdAt),
      updatedAt: new Date(driveFile.updatedAt),
      fileId: driveFile.fileId,
      type: driveFile.type,
      status: driveFile.status,
      folderId: driveFile.folderId,
      folderUuid: driveFile.folderUuid,
    };
  };

  public getFileMetadata = async (uuid: string): Promise<DriveFileItem> => {
    const storageClient = SdkManager.instance.getStorage(true);

    const [getFileMetadata] = storageClient.getFile(uuid);

    const fileMetadata = await getFileMetadata;
    return DriveUtils.driveFileMetaToItem(fileMetadata);
  };

  public moveFile = (payload: StorageTypes.MoveFileUuidPayload): Promise<StorageTypes.FileMeta> => {
    const storageClient = SdkManager.instance.getStorage(true);
    return storageClient.moveFileByUuid(payload);
  };

  public renameFile = (fileUuid: string, payload: { plainName?: string; type?: string | null }): Promise<void> => {
    const storageClient = SdkManager.instance.getStorage(true);
    return storageClient.updateFileMetaByUUID(fileUuid, payload);
  };

  public getFileMetadataByPath = async (path: string): Promise<DriveFileItem> => {
    const storageClient = SdkManager.instance.getStorage(true);
    const fileMetadata = await storageClient.getFileByPath(encodeURIComponent(path));
    return DriveUtils.driveFileMetaToItem(fileMetadata);
  };

  public createThumbnail = (payload: StorageTypes.ThumbnailEntry): Promise<StorageTypes.Thumbnail> => {
    const storageClient = SdkManager.instance.getStorage(false);
    return storageClient.createThumbnailEntry(payload);
  };
}
