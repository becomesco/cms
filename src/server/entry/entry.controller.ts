import {
  Controller,
  AppLogger,
  Logger,
  Service,
  Get,
  HttpErrorFactory,
  JWTEncoding,
  HttpStatus,
  JWTSecurity,
  RoleName,
  PermissionName,
  JWTConfigService,
  StringUtility,
  Post,
  ObjectUtility,
  Put,
  Delete,
} from 'purple-cheetah';
import { EntryService } from './entry.service';
import { Request } from 'express';
import { Entry, EntryContent } from './models/entry.model';
import { TemplateService } from '../template/template.service';
import { EntryFactory } from './factories/entry.factory';
import { PropUtil } from '../prop/prop-util';
import { GroupService } from '../group/group.service';
import { APISecurity } from '../api/api-security';
import { Template, TemplateType } from '../template/models/template.model';
import { PropType, PropQuill } from '../prop/interfaces/prop.interface';
import { LanguageService } from '../languages/language.service';
import { KeyCashService } from '../api/key-cash.service';
import { Language } from '../languages';

/**
 * Controller that provides CRUD for Entry object.
 */
@Controller('/template')
export class EntryController {
  @AppLogger(EntryController)
  private logger: Logger;
  /** Service that handles interaction with Entry objects in database. */
  @Service(EntryService)
  private entryService: EntryService;
  /** Service that handles interaction with Template objects in database. */
  @Service(TemplateService)
  private templateService: TemplateService;
  /** Service that handles interaction with Group objects in database. */
  @Service(GroupService)
  private groupService: GroupService;
  /** Service that handles interaction with Language objects in database. */
  @Service(LanguageService)
  private languageService: LanguageService;

  /** Return all Entries for all Templates. */
  @Get('/entry/all')
  async getAllEntries(request: Request): Promise<{ entries: Entry[] }> {
    const error = HttpErrorFactory.simple('getEvery', this.logger);
    const jwt = JWTEncoding.decode(request.headers.authorization);
    if (jwt instanceof Error) {
      throw error.occurred(HttpStatus.UNAUTHORIZED, jwt.message);
    } else {
      const jwtValid = JWTSecurity.validateAndCheckTokenPermissions(
        jwt,
        [RoleName.ADMIN, RoleName.USER],
        PermissionName.READ,
        JWTConfigService.get('user-token-config'),
      );
      if (jwtValid instanceof Error) {
        throw error.occurred(HttpStatus.UNAUTHORIZED, jwtValid.message);
      }
    }
    const entries = await this.entryService.findAll();
    return {
      entries,
    };
  }

  /** Returns all Entries for specified Template */
  @Get('/:templateIdOrName/entry/all')
  async getAllAndCompile(request: Request): Promise<{ entries: Entry[] }> {
    const error = HttpErrorFactory.simple('getAll', this.logger);
    if (request.query.signature) {
      try {
        APISecurity.verify(
          request.query,
          request.body,
          request.method.toUpperCase(),
          request.originalUrl,
        );
      } catch (e) {
        throw error.occurred(HttpStatus.UNAUTHORIZED, e.message);
      }
    } else {
      const jwt = JWTEncoding.decode(request.headers.authorization);
      if (jwt instanceof Error) {
        throw error.occurred(HttpStatus.UNAUTHORIZED, jwt.message);
      } else {
        const jwtValid = JWTSecurity.validateAndCheckTokenPermissions(
          jwt,
          [RoleName.ADMIN, RoleName.USER],
          PermissionName.READ,
          JWTConfigService.get('user-token-config'),
        );
        if (jwtValid instanceof Error) {
          throw error.occurred(HttpStatus.UNAUTHORIZED, jwtValid.message);
        }
      }
    }
    let template: Template;
    if (StringUtility.isIdValid(request.params.templateIdOrName) === true) {
      template = await this.templateService.findById(
        request.params.templateIdOrName,
      );
    } else {
      template = await this.templateService.findByName(
        request.params.templateIdOrName,
      );
    }
    if (template === null) {
      throw error.occurred(
        HttpStatus.NOT_FOUNT,
        `Template with ID or Name '${request.params.templateIdOrName}' does not exist.`,
      );
    }
    const entries: Entry[] = await this.entryService.findAllById(
      template.entryIds,
    );
    return {
      entries,
    };
  }

  /** Returns all Entries for specified Template in prettier format. */
  @Get('/:templateIdOrName/entry/all/compile')
  async getAll(request: Request): Promise<{ entries: any[] }> {
    const error = HttpErrorFactory.simple('getAll', this.logger);
    if (request.query.signature) {
      try {
        APISecurity.verify(
          request.query,
          request.body,
          request.method.toUpperCase(),
          request.originalUrl,
        );
      } catch (e) {
        throw error.occurred(HttpStatus.UNAUTHORIZED, e.message);
      }
    } else {
      const jwt = JWTEncoding.decode(request.headers.authorization);
      if (jwt instanceof Error) {
        throw error.occurred(HttpStatus.UNAUTHORIZED, jwt.message);
      } else {
        const jwtValid = JWTSecurity.validateAndCheckTokenPermissions(
          jwt,
          [RoleName.ADMIN, RoleName.USER],
          PermissionName.READ,
          JWTConfigService.get('user-token-config'),
        );
        if (jwtValid instanceof Error) {
          throw error.occurred(HttpStatus.UNAUTHORIZED, jwtValid.message);
        }
      }
    }
    let template: Template;
    if (StringUtility.isIdValid(request.params.templateIdOrName) === true) {
      template = await this.templateService.findById(
        request.params.templateIdOrName,
      );
    } else {
      template = await this.templateService.findByName(
        request.params.templateIdOrName,
      );
    }
    if (template === null) {
      throw error.occurred(
        HttpStatus.NOT_FOUNT,
        `Template with ID or Name '${request.params.templateIdOrName}' does not exist.`,
      );
    }
    const entries: Entry[] = await this.entryService.findAllById(
      template.entryIds,
    );
    return {
      entries: entries.map(e => {
        return PropUtil.contentToPrettyJSON(e.content, {
          _id: e._id.toHexString(),
          createdAt: e.createdAt,
          updatedAt: e.updatedAt,
          user: {
            _id: e.userId,
          },
        });
      }),
    };
  }

  /** Return a specified Entry for a specified Template. */
  @Get('/:templateIdOrName/entry/:id')
  async getById(request: Request): Promise<{ entry: Entry }> {
    const error = HttpErrorFactory.simple('getById', this.logger);
    if (StringUtility.isIdValid(request.params.id) === false) {
      throw error.occurred(
        HttpStatus.FORBIDDEN,
        `Invalid ID '${request.params.id}' was provided.`,
      );
    }
    if (request.query.signature) {
      try {
        APISecurity.verify(
          request.query,
          request.body,
          request.method.toUpperCase(),
          request.originalUrl,
        );
      } catch (e) {
        throw error.occurred(HttpStatus.UNAUTHORIZED, e.message);
      }
    } else {
      const jwt = JWTEncoding.decode(request.headers.authorization);
      if (jwt instanceof Error) {
        throw error.occurred(HttpStatus.UNAUTHORIZED, jwt.message);
      } else {
        const jwtValid = JWTSecurity.validateAndCheckTokenPermissions(
          jwt,
          [RoleName.ADMIN, RoleName.USER],
          PermissionName.READ,
          JWTConfigService.get('user-token-config'),
        );
        if (jwtValid instanceof Error) {
          throw error.occurred(HttpStatus.UNAUTHORIZED, jwtValid.message);
        }
      }
    }
    let template: Template;
    if (StringUtility.isIdValid(request.params.templateIdOrName) === true) {
      template = await this.templateService.findById(
        request.params.templateIdOrName,
      );
    } else {
      template = await this.templateService.findByName(
        request.params.templateIdOrName,
      );
    }
    if (template === null) {
      throw error.occurred(
        HttpStatus.NOT_FOUNT,
        `Template with ID or Name '${request.params.templateIdOrName}' does not exist.`,
      );
    }
    if (!template.entryIds.find(e => e === request.params.id)) {
      throw error.occurred(
        HttpStatus.FORBIDDEN,
        `Entry with ID '${request.params.id}' does not belong to Template '${request.params.templateId}'.`,
      );
    }
    const entry: Entry = await this.entryService.findById(request.params.id);
    if (!entry) {
      throw error.occurred(
        HttpStatus.NOT_FOUNT,
        `Entry with ID '${request.params.id}' does now exist.`,
      );
    }
    return {
      entry,
    };
  }

  /** Returns an Entry in prettier format. */
  @Get('/:templateIdOrName/entry/:id/compile')
  async getByIdAndReturnMD(request: Request): Promise<any> {
    const error = HttpErrorFactory.simple('getById', this.logger);
    if (StringUtility.isIdValid(request.params.id) === false) {
      throw error.occurred(
        HttpStatus.FORBIDDEN,
        `Invalid ID '${request.params.id}' was provided.`,
      );
    }
    if (request.query.signature) {
      try {
        APISecurity.verify(
          request.query,
          request.body,
          request.method.toUpperCase(),
          request.originalUrl,
        );
      } catch (e) {
        throw error.occurred(HttpStatus.UNAUTHORIZED, e.message);
      }
    } else {
      const jwt = JWTEncoding.decode(request.headers.authorization);
      if (jwt instanceof Error) {
        throw error.occurred(HttpStatus.UNAUTHORIZED, jwt.message);
      } else {
        const jwtValid = JWTSecurity.validateAndCheckTokenPermissions(
          jwt,
          [RoleName.ADMIN, RoleName.USER],
          PermissionName.READ,
          JWTConfigService.get('user-token-config'),
        );
        if (jwtValid instanceof Error) {
          throw error.occurred(HttpStatus.UNAUTHORIZED, jwtValid.message);
        }
      }
    }
    let template: Template;
    if (StringUtility.isIdValid(request.params.templateIdOrName) === true) {
      template = await this.templateService.findById(
        request.params.templateIdOrName,
      );
    } else {
      template = await this.templateService.findByName(
        request.params.templateIdOrName,
      );
    }
    if (template === null) {
      throw error.occurred(
        HttpStatus.NOT_FOUNT,
        `Template with ID or Name '${request.params.templateIdOrName}' does not exist.`,
      );
    }
    if (!template.entryIds.find(e => e === request.params.id)) {
      throw error.occurred(
        HttpStatus.FORBIDDEN,
        `Entry with ID '${request.params.id}' does not belong to Template '${request.params.templateId}'.`,
      );
    }
    const entry: Entry = await this.entryService.findById(request.params.id);
    if (!entry) {
      throw error.occurred(
        HttpStatus.NOT_FOUNT,
        `Entry with ID '${request.params.id}' does now exist.`,
      );
    }
    return {
      entry: PropUtil.contentToPrettyJSON(entry.content, {
        _id: entry._id.toHexString(),
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        user: {
          _id: entry.userId,
        },
      }),
    };
  }

  /** Creates a new Entry and adds its pointer to the Template. */
  @Post('/:templateIdOrName/entry')
  async add(request: Request): Promise<{ entry: Entry }> {
    const error = HttpErrorFactory.simple('add', this.logger);
    if (typeof request.body.content === 'undefined') {
      throw error.occurred(
        HttpStatus.BAD_REQUEST,
        `Missing property 'content' in body.`,
      );
    }
    if (request.body.content instanceof Array) {
      for (const i in request.body.content) {
        const content = request.body.content[i];
        if (typeof content.lng === 'undefined') {
          throw error.occurred(
            HttpStatus.BAD_REQUEST,
            `Missing 'lng' property in 'body.content[${i}]'`,
          );
        }
        if (typeof content.props === 'undefined') {
          throw error.occurred(
            HttpStatus.BAD_REQUEST,
            `Missing 'props' property in 'body.content[${i}]'`,
          );
        }
      }
    } else {
      throw error.occurred(
        HttpStatus.BAD_REQUEST,
        `Expected an array for 'body.content'.`,
      );
    }
    let userId: string = '';
    if (request.query.signature) {
      try {
        APISecurity.verify(
          request.query,
          request.body,
          request.method.toUpperCase(),
          request.originalUrl,
        );
      } catch (e) {
        throw error.occurred(HttpStatus.UNAUTHORIZED, e.message);
      }
      userId = KeyCashService.findById(request.query.key).userId;
    } else {
      const jwt = JWTEncoding.decode(request.headers.authorization);
      if (jwt instanceof Error) {
        throw error.occurred(HttpStatus.UNAUTHORIZED, jwt.message);
      } else {
        const jwtValid = JWTSecurity.validateAndCheckTokenPermissions(
          jwt,
          [RoleName.ADMIN, RoleName.USER],
          PermissionName.WRITE,
          JWTConfigService.get('user-token-config'),
        );
        if (jwtValid instanceof Error) {
          throw error.occurred(HttpStatus.UNAUTHORIZED, jwtValid.message);
        }
      }
      userId = jwt.payload.userId;
    }
    let template: Template;
    if (StringUtility.isIdValid(request.params.templateIdOrName) === true) {
      template = await this.templateService.findById(
        request.params.templateIdOrName,
      );
    } else {
      template = await this.templateService.findByName(
        request.params.templateIdOrName,
      );
    }
    if (template === null) {
      throw error.occurred(
        HttpStatus.NOT_FOUNT,
        `Template with ID or Name '${request.params.templateIdOrName}' does not exist.`,
      );
    }
    const entry = EntryFactory.instance;
    entry.templateId = template._id.toHexString();
    entry.userId = userId;
    entry.content = [];
    for (const i in request.body.content) {
      const content = request.body.content[i];
      const language = await this.languageService.findByCode(content.lng);
      if (language === null) {
        throw error.occurred(
          HttpStatus.FORBIDDEN,
          `Language '${content.lng}' is not added to selection. ` +
            `Error found in 'body.content[${i}]'.`,
        );
      }
      try {
        const props = await PropUtil.getPropsFromUntrustedObject(
          content.props,
          this.groupService,
        );
        PropUtil.compareWithTemplate(
          props,
          template.entryTemplate,
          `entry[${i}]`,
        );
        entry.content.push({
          lng: language.code,
          props,
        });
      } catch (e) {
        throw error.occurred(HttpStatus.BAD_REQUEST, e.message);
      }
      if (template.type === TemplateType.RICH_CONTENT) {
        const quillProp = entry.content[entry.content.length - 1].props.find(
          e => e.type === PropType.QUILL,
        );
        if (!quillProp) {
          throw error.occurred(
            HttpStatus.FORBIDDEN,
            `Entry for Template of type RICH_CONTENT ` +
              `must have property of type QUILL. Error in ` +
              `'body.content[${i}].props'.`,
          );
        }
        quillProp.value = quillProp.value as PropQuill;
        const entryWithSameSlug = await this.entryService.findByTemplateIdAndEntrySlug(
          template._id.toHexString(),
          quillProp.value.heading.slug,
        );
        if (entryWithSameSlug !== null) {
          for (const j in entry.content[entry.content.length - 1].props) {
            const e = entry.content[entry.content.length - 1].props[j];
            if (e.type === PropType.QUILL) {
              e.value = e.value as PropQuill;
              e.value.heading.slug = `${
                e.value.heading.slug
              }-${await this.entryService.count()}`;
            }
          }
        }
      }
    }
    const addEntryResult = await this.entryService.add(entry);
    if (addEntryResult === false) {
      throw error.occurred(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to add Entry to database.',
      );
    }
    template.entryIds.push(entry._id.toHexString());
    const updateTemplateResult = await this.templateService.update(template);
    if (updateTemplateResult === false) {
      await this.entryService.deleteById(entry._id.toHexString());
      throw error.occurred(
        HttpStatus.INTERNAL_SERVER_ERROR,
        `Failed to update Template in database.`,
      );
    }
    return {
      entry,
    };
  }

  /** Updates a specified Entry for a specified Template. */
  @Put('/:templateIdOrName/entry')
  async update(request: Request): Promise<{ entry: Entry }> {
    const error = HttpErrorFactory.simple('update', this.logger);
    try {
      ObjectUtility.compareWithSchema(request.body, {
        _id: {
          __type: 'string',
          __required: true,
        },
        onlyLng: {
          __type: 'string',
          __required: false,
        },
      });
    } catch (e) {
      throw error.occurred(HttpStatus.BAD_REQUEST, {
        message: 'Bad data model.',
        desc: e.message,
      });
    }
    if (StringUtility.isIdValid(request.body._id) === false) {
      throw error.occurred(
        HttpStatus.FORBIDDEN,
        `Invalid ID '${request.body._id}' was provided.`,
      );
    }
    if (request.query.signature) {
      try {
        APISecurity.verify(
          request.query,
          request.body,
          request.method.toUpperCase(),
          request.originalUrl,
        );
      } catch (e) {
        throw error.occurred(HttpStatus.UNAUTHORIZED, e.message);
      }
    } else {
      const jwt = JWTEncoding.decode(request.headers.authorization);
      if (jwt instanceof Error) {
        throw error.occurred(HttpStatus.UNAUTHORIZED, jwt.message);
      } else {
        const jwtValid = JWTSecurity.validateAndCheckTokenPermissions(
          jwt,
          [RoleName.ADMIN, RoleName.USER],
          PermissionName.WRITE,
          JWTConfigService.get('user-token-config'),
        );
        if (jwtValid instanceof Error) {
          throw error.occurred(HttpStatus.UNAUTHORIZED, jwtValid.message);
        }
      }
    }
    let template: Template;
    if (StringUtility.isIdValid(request.params.templateIdOrName) === true) {
      template = await this.templateService.findById(
        request.params.templateIdOrName,
      );
    } else {
      template = await this.templateService.findByName(
        request.params.templateIdOrName,
      );
    }
    if (template === null) {
      throw error.occurred(
        HttpStatus.NOT_FOUNT,
        `Template with ID or Name '${request.params.templateIdOrName}' does not exist.`,
      );
    }
    const entry = await this.entryService.findById(request.body._id);
    if (entry === null) {
      throw error.occurred(
        HttpStatus.NOT_FOUNT,
        `Entry with ID '${request.body._id}' does not exist.`,
      );
    }
    // entry.content = [];
    let changeDetected: boolean = false;
    if (typeof request.body.content !== 'undefined') {
      changeDetected = true;
      const updateEntry = async (
        content: EntryContent,
        language: Language,
        i: number,
      ) => {
        try {
          const props = await PropUtil.getPropsFromUntrustedObject(
            content.props,
            this.groupService,
          );
          PropUtil.compareWithTemplate(
            props,
            template.entryTemplate,
            `entry[${i}]`,
          );
          if (entry.content.find(e => e.lng === language.code)) {
            entry.content.forEach(e => {
              if (e.lng === language.code) {
                e.props = props;
              }
            });
          } else {
            entry.content.push({
              lng: language.code,
              props,
            });
          }
        } catch (e) {
          throw error.occurred(HttpStatus.BAD_REQUEST, e.message);
        }
        if (template.type === TemplateType.RICH_CONTENT) {
          const quillProp = entry.content[entry.content.length - 1].props.find(
            e => e.type === PropType.QUILL,
          );
          if (!quillProp) {
            throw error.occurred(
              HttpStatus.FORBIDDEN,
              `Entry for Template of type RICH_CONTENT ` +
                `must have property of type QUILL. Error in ` +
                `'body.content[${i}].props'.`,
            );
          }
          quillProp.value = quillProp.value as PropQuill;
          const entryWithSameSlug = await this.entryService.findByTemplateIdAndEntrySlug(
            template._id.toHexString(),
            quillProp.value.heading.slug,
          );
          if (entryWithSameSlug !== null) {
            for (const j in entry.content[entry.content.length - 1].props) {
              const e = entry.content[entry.content.length - 1].props[j];
              if (e.type === PropType.QUILL) {
                e.value = e.value as PropQuill;
                e.value.heading.slug = `${
                  e.value.heading.slug
                }-${await this.entryService.count()}`;
              }
            }
          }
        }
      };
      if (typeof request.body.onlyLng !== 'undefined') {
        const content = request.body.content.find(
          e => e.lng === request.body.onlyLng,
        );
        const language = await this.languageService.findByCode(
          request.body.onlyLng,
        );
        if (language === null) {
          throw error.occurred(
            HttpStatus.FORBIDDEN,
            `Language '${request.body.onlyLng}' is not added to selection.`,
          );
        }
        await updateEntry(content, language, 0);
      } else {
        for (const i in request.body.content) {
          const content = request.body.content[i];
          const language = await this.languageService.findByCode(content.lng);
          if (language === null) {
            throw error.occurred(
              HttpStatus.FORBIDDEN,
              `Language '${content.lng}' is not added to selection. Error found in 'body.content[${i}]'.`,
            );
          }
          await updateEntry(content, language, parseInt(i, 10));
        }
      }
    }
    if (changeDetected === false) {
      throw error.occurred(HttpStatus.FORBIDDEN, 'Nothing to update.');
    }
    const updateEntryResult = await this.entryService.update(entry);
    if (updateEntryResult === false) {
      throw error.occurred(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to update the Entry in database.',
      );
    }
    return {
      entry,
    };
  }

  /** Removes a specified Entry from the database
   * and its pointer in the Template.
   */
  @Delete('/:templateIdOrName/entry/:id')
  async deleteById(request: Request): Promise<{ message: string }> {
    const error = HttpErrorFactory.simple('deleteById', this.logger);
    if (StringUtility.isIdValid(request.params.id) === false) {
      throw error.occurred(
        HttpStatus.FORBIDDEN,
        `Invalid ID '${request.params.id}' was provided.`,
      );
    }
    if (request.query.signature) {
      try {
        APISecurity.verify(
          request.query,
          request.body,
          request.method.toUpperCase(),
          request.originalUrl,
        );
      } catch (e) {
        throw error.occurred(HttpStatus.UNAUTHORIZED, e.message);
      }
    } else {
      const jwt = JWTEncoding.decode(request.headers.authorization);
      if (jwt instanceof Error) {
        throw error.occurred(HttpStatus.UNAUTHORIZED, jwt.message);
      } else {
        const jwtValid = JWTSecurity.validateAndCheckTokenPermissions(
          jwt,
          [RoleName.ADMIN, RoleName.USER],
          PermissionName.WRITE,
          JWTConfigService.get('user-token-config'),
        );
        if (jwtValid instanceof Error) {
          throw error.occurred(HttpStatus.UNAUTHORIZED, jwtValid.message);
        }
      }
    }
    let template: Template;
    if (StringUtility.isIdValid(request.params.templateIdOrName) === true) {
      template = await this.templateService.findById(
        request.params.templateIdOrName,
      );
    } else {
      template = await this.templateService.findByName(
        request.params.templateIdOrName,
      );
    }
    if (template === null) {
      throw error.occurred(
        HttpStatus.NOT_FOUNT,
        `Template with ID or Name '${request.params.templateIdOrName}' does not exist.`,
      );
    }
    const entry = await this.entryService.findById(request.params.id);
    if (entry === null) {
      throw error.occurred(
        HttpStatus.NOT_FOUNT,
        `Entry with ID '${request.params.id}' does not exist.`,
      );
    }
    const deleteEntryResult = await this.entryService.deleteById(
      request.params.id,
    );
    if (deleteEntryResult === false) {
      throw error.occurred(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to delete the Entry from database.',
      );
    }
    template.entryIds = template.entryIds.filter(
      e => e !== entry._id.toHexString(),
    );
    const updateTemplateResult = await this.templateService.update(template);
    if (updateTemplateResult === false) {
      throw error.occurred(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to update Template.',
      );
    }
    return {
      message: 'Success.',
    };
  }
}
